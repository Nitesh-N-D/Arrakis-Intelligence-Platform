import { User } from "../models/User.js";

export class UserRepository {
  create(data) {
    return User.create(data);
  }

  findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  }

  findById(id) {
    return User.findById(id);
  }

  updateById(id, update) {
    return User.findByIdAndUpdate(id, update, { new: true });
  }
}
