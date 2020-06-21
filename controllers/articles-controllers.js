const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const Article = require('../models/article');
const User = require('../models/user');

const getArticleById = async (req, res, next) => {
  const articleId = req.params.aid;
  let article;
  try {
    article = await Article.findById(articleId);
    //findById is a mongoose function
  } catch (err) {
    const error = new HttpError(
      'Could not get the article. Please try agian later.',
      500
    );
    return next(error);
  }

  if (!article) {
    const error = new HttpError('Article does not exsist.', 404);
    return next(error);
  }
  res.json({ article: article.toObject({ getters: true }) });
  //mongoDb returns something that has to be converted to an object
  //so that we can send it as json
  //getters = true ensures we have id and not just _id in mongoose document
  //for that particular article
};

const getArticlesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let articles;
  try {
    articles = await Article.find({ creator: userId });
  } catch (err) {
    const error = new HttpError(
      'Could not get the article. Please try agian later.',
      500
    );
    return next(error);
  }

  if (!articles || articles.length === 0) {
    return next(
      new HttpError('Articles do not exsist for the provided user.', 404)
    );
  }

  res.json({
    articles: articles.map(article => article.toObject({ getters: true })),
  });
};

const createArticle = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    //return next(new HttpError('Please check word limit and try again.'), 422);
    console.log(errors);
    return next(new HttpError(errors), 422);
  }
  const { title, content, creator } = req.body;
  const createdArticle = new Article({
    title,
    content,
    creator,
  });
  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError('Could not reach server. Try again later.');
    return next(error);
  }
  if (!user) {
    const error = new HttpError('User does not exsist.');
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdArticle.save({ session: sess });
    user.articles.push(createdArticle);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Could not save article. Try again later please.',
      500
    );
    return next(error);
  }

  res.status(201).json({ article: createdArticle });
};

const updateArticle = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }
  console.log(req.body);
  const { title, content } = req.body;
  const articleId = req.params.aid;

  let article;
  try {
    article = await Article.findById(articleId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong at the server. Try again please.',
      500
    );
    return next(error);
  }
  //console.log(article);
  if (!article) {
    const error = new HttpError('Article does not exsist.', 404);
    return next(error);
  }

  //we use toString to convert the special mongoose id object into something normal
  if (article.creator.toString() !== req.userData.userId) {
    const error = new HttpError('You are not allowed to edit this place.', 401);
    return next(error);
  }

  article.title = title;
  article.content = content;
  try {
    await article.save();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong at the server. Try again later.',
      500
    );
    return next(error);
  }
  res.status(200).json({ article: article.toObject({ getters: true }) });
};

const deleteArticle = async (req, res, next) => {
  const articleId = req.params.aid;
  let article;
  try {
    article = await Article.findById(articleId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete article.',
      500
    );
    return next(error);
  }

  if (!article) {
    const error = new HttpError('Could not find article for this id.', 404);
    return next(error);
  }

  if (article.creator.id !== req.userData.userId) {
    const error = new HttpError(
      'You are not allowed to delete this place.',
      401
    );
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await article.remove({ session: sess });
    article.creator.articles.pull(article); //use of populate allows us to do this
    await article.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete article.',
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'Article Deleted' });
};

exports.getArticleById = getArticleById;
exports.getArticlesByUserId = getArticlesByUserId;
exports.createArticle = createArticle;
exports.updateArticle = updateArticle;
exports.deleteArticle = deleteArticle;
