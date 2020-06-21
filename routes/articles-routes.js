const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const checkAuth = require('../middleware/check-auth');

const articlesControllers = require('../controllers/articles-controllers');

router.get('/:aid', articlesControllers.getArticleById);

router.get('/user/:uid', articlesControllers.getArticlesByUserId);

router.use(checkAuth); //we use .use so for all reqs below this we now check for auth

router.post(
  '/',
  [check('title').not().isEmpty(), check('content').isLength({ min: 4 })],
  articlesControllers.createArticle
);

router.patch(
  '/:aid',
  [check('title').not().isEmpty(), check('content').isLength({ min: 5 })],
  articlesControllers.updateArticle
);

router.delete('/:aid', articlesControllers.deleteArticle);

module.exports = router;
