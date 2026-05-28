import { Router } from 'express';
import { sitters } from '../data.js';

const router = Router();

router.get('/', (req, res) => {
  const type = req.query.type;
  if (!type) {
    return res.json({ sitters });
  }

  const filtered = sitters.filter((sitter) => sitter.type === type.toLowerCase());
  return res.json({ sitters: filtered });
});

export default router;
