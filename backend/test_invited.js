const {pool} = require('./db');
pool.query("INSERT INTO applications (opp_id, team_id, applicant_id, status) VALUES ('123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174000', 'invited')")
  .then(() => console.log('success'))
  .catch(err => console.log(err.message))
  .finally(() => pool.end());
