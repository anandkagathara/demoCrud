exports.allAccess = (req, res) => {
  res.status(200).send("Public Page.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Page.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Page.");
};



