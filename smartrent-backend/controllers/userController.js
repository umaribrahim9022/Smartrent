const User = require('../models/User');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, address, profileImage, preferences } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (name) user.name = name;
    if (address !== undefined) user.address = address;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();
    user.password = undefined;

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};