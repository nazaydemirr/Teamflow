const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { authMiddleware } = require("../middlewares/auth");

// OpenRouter API URL
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * @swagger
 * /matchmaking/search:
 *   get:
 *     summary: "Yetenek bazlı kullanıcı araması"
 *     tags: [Matchmaking]
 *     parameters:
 *       - in: query
 *         name: skill
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kullanıcı listesi
 */
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const { skill } = req.query;
    if (!skill) {
      return res.status(400).json({ error: "skill parametresi zorunludur." });
    }

    // 1. İlgili yeteneğe sahip kullanıcıları bul
    const usersResult = await pool.query(
      `SELECT id, display_name, skills FROM users WHERE skills ? $1`,
      [skill]
    );

    const users = usersResult.rows;

    if (users.length === 0) {
      return res.status(200).json({ items: [] });
    }

    // 2. Her kullanıcı için katıldığı/liderlik ettiği takımları bul
    // Performans için in-memory birleştirme yapabiliriz
    const userIds = users.map(u => u.id);
    const teamsResult = await pool.query(
      `SELECT t.id as team_id, t.name as team_name, t.leader_id, a.applicant_id as member_id
       FROM teams t
       LEFT JOIN applications a ON a.team_id = t.id AND a.status = 'Onaylandi'
       WHERE t.leader_id = ANY($1) OR a.applicant_id = ANY($1)`,
      [userIds]
    );

    const items = users.map(user => {
      const ledTeams = teamsResult.rows.filter(row => row.leader_id === user.id).map(r => ({ id: r.team_id, name: r.team_name }));
      const joinedTeams = teamsResult.rows.filter(row => row.member_id === user.id).map(r => ({ id: r.team_id, name: r.team_name }));
      
      // Remove duplicates just in case
      const uniqueLed = Array.from(new Map(ledTeams.map(item => [item.id, item])).values());
      const uniqueJoined = Array.from(new Map(joinedTeams.map(item => [item.id, item])).values());

      return {
        id: user.id,
        displayName: user.display_name,
        skills: user.skills || [],
        teamsLed: uniqueLed,
        teamsJoined: uniqueJoined
      };
    });

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Matchmaking search error:", error);
    return res.status(500).json({ error: "İşlem sırasında bir hata oluştu: " + error.message });
  }
});

/**
 * @swagger
 * /matchmaking/invite:
 *   post:
 *     summary: "Seçilen kullanıcıya yapay zeka ile davet gönderir"
 *     tags: [Matchmaking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: string
 *               eksik_yetenek:
 *                 type: string
 *               team_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Başarılı
 */
router.post("/invite", authMiddleware, async (req, res) => {
  try {
    const { user_id, eksik_yetenek, team_id } = req.body;

    if (!user_id || !eksik_yetenek || !team_id) {
      return res.status(400).json({ error: "user_id, eksik_yetenek ve team_id zorunludur." });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "OPENROUTER_API_KEY ortam değişkeni ayarlanmamış." });
    }

    const teamCheck = await pool.query('SELECT id, name FROM teams WHERE id = $1', [team_id]);
    if (teamCheck.rows.length === 0) {
      return res.status(404).json({ error: "Geçersiz takım ID'si." });
    }
    const teamName = teamCheck.rows[0].name;

    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "Geçersiz kullanıcı ID'si." });
    }

    const prompt = `Sen bir takım kurma asistanısın. ${eksik_yetenek} yeteneğine sahip bu kişiye, ${teamName} takımının ona ihtiyacı olduğunu söyleyen kısa, samimi ve profesyonel bir davet mesajı yaz.
ÖNEMLİ KURALLAR:
- Kesinlikle alternatif seçenekler sunma (Seçenek 1, Seçenek 2 vb. yazma).
- Sadece tek bir mesaj metni üret.
- Mesajın başına veya sonuna açıklama, not, tavsiye veya giriş cümlesi (örn: "İşte mesajınız:") ekleme. Sadece gönderilecek mesajın kendisini ver.`;

    let messageText = `Merhaba! ${teamName} takımı olarak ${eksik_yetenek} yeteneğine sahip birine ihtiyacımız var. Aramıza katılıp birlikte harika işler başarmaya ne dersin?`;

    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemma-2-9b-it:free",
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.choices && data.choices.length > 0) {
          messageText = data.choices[0].message.content.trim();
        }
      } else {
        console.warn(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }
    } catch (apiError) {
      console.error("OpenRouter API request failed:", apiError);
    }

    const result = await pool.query(
      `INSERT INTO notifications (user_id, team_id, message) VALUES ($1, $2, $3) RETURNING id`,
      [user_id, team_id, messageText]
    );

    return res.status(200).json({
      message: "Davet başarıyla gönderildi.",
      notificationId: result.rows[0].id
    });

  } catch (error) {
    console.error("Matchmaking invite error:", error);
    return res.status(500).json({ error: "İşlem sırasında bir hata oluştu: " + error.message });
  }
});

module.exports = router;
