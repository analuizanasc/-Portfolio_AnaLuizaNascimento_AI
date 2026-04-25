const users = [];

const findAll = () => users;

const findById = (id) => users.find((u) => u.id === id);

const findByEmail = (email) => users.find((u) => u.email === email);

const create = (user) => {
  users.push(user);
  return user;
};

const remove = (id) => {
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return false;
  users.splice(index, 1);
  return true;
};

const clear = () => {
  users.length = 0;
};

module.exports = { findAll, findById, findByEmail, create, remove, clear };
