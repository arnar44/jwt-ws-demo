const { handleLikesQuery } = require('../db/queries');

function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

function handleLikes(columnName, table, isLike) {
  return catchErrors(async (req, res) => {
    const { id } = req.user;
    const columnId = Number(req.params.id);
    const result = await handleLikesQuery({
      id, columnId, columnName, table, isLike,
    });

    if (!result.success) {
      return res.status(result.code).json(result.obj);
    }

    return res.status(200).json(result.item);
  });
}

module.exports = {
  catchErrors,
  handleLikes,
};
