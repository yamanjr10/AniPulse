const { body, param, query } = require('express-validator');

const validateAnime = [
  body('title').notEmpty().trim().escape(),
  body('type').isIn(['TV', 'Movie', 'OVA', 'ONA', 'Special']),
  body('episodes').isInt({ min: 1, max: 10000 }),
  body('score').optional().isFloat({ min: 0, max: 10 }),
  body('userStatus').isIn(['Completed', 'Watching', 'Plan to Watch', 'Dropped'])
];

const validatePost = [
  body('title').notEmpty().trim().escape().isLength({ max: 100 }),
  body('content').notEmpty().trim().escape().isLength({ max: 5000 }),
  body('category').isIn(['discussion', 'recommendation', 'question', 'achievement'])
];

const validateComment = [
  body('content').notEmpty().trim().escape().isLength({ max: 1000 })
];

module.exports = {
  validateAnime,
  validatePost,
  validateComment
};
