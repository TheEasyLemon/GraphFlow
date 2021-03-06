const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load input validation
const validateRegisterInput = require('../validation/register');
const validateLoginInput = require('../validation/login');

// Load models
const User = require('../models/user');
const Graph = require('../models/graph');
const SECRET_OR_KEY = process.env.SECRET_OR_KEY;

exports.auth = function(req, res) {
  // "Token Bearer ..."
  const token = req.headers.authorization.slice(13)

  jwt.verify(token, SECRET_OR_KEY, function(err, decoded) {
    if (err) {
      return res.status(401).json({ message: 'Invalid Credentials.' })
    } else {
      User.findById(decoded.id).then(user => {
        if (user) {
          return res.json({
            user: {
              uuid: user._id,
              name: user.name,
              created_date: user.date
            }
          })
        } else {
          return res.status(500).json({ message: 'User not found.' })
        }
      })

    }
  })
}

exports.register = function(req, res) {
  // Form validation
  const { errors, isValid } = validateRegisterInput(req.body);
  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      return res.status(400).json({ email: 'Email already exists' });
    } else {
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
      });
      // Hash password before saving in database
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
}

exports.login = function(req, res) {
  // Form validation
  const { errors, isValid } = validateLoginInput(req.body);
  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;

  // Find user by email
  User.findOne({ email }).then(user => {
    // Check if user exists
    if (!user) {
      return res.status(404).json({ emailnotfound: 'Email not found' });
    }
    // Check password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // User matched
        // Create JWT Payload
        const payload = {
          id: user.id,
          name: user.name
        };
        // Sign token
        jwt.sign(
          payload,
          SECRET_OR_KEY,
          {
            expiresIn: 2592000 // 1 month in seconds
          },
          (err, token) => {
            res.json({
              success: true,
              token: 'Bearer ' + token,
              user: {
                uuid: user._id,
                name: user.name,
                created_date: user.date
              }
            });
          }
        );
      } else {
        return res
          .status(400)
          .json({ passwordincorrect: 'Incorrect password' });
      }
    });
  });
}

exports.user_graphs = function(req, res)  {
  Graph.find({ user_id: req.params.id }, (err, docs) => {
    if (err) {
      return res.status(500).json({ error: err })
    }
    return res.status(200).json({ data: docs })
  })

}
