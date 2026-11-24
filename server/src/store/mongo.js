import mongoose from "mongoose";

const twoFactorSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    secretEnc: String,
    pendingSecretEnc: String,
    backupCodes: { type: [String], default: [] },
    lastCode: String,
    lastCodeAt: Number,
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    property: { type: String, default: "" },
    phone: { type: String, default: "" },
    passwordHash: { type: String, required: true },
    twoFactor: { type: twoFactorSchema, default: () => ({}) },
  },
  { timestamps: true },
);

const toPlain = (doc) => {
  if (!doc) return null;
  const o = doc.toObject();
  return { ...o, id: String(o._id), createdAt: o.createdAt?.toISOString?.() ?? o.createdAt };
};

export async function mongoStore(uri) {
  await mongoose.connect(uri);
  const User = mongoose.models.User || mongoose.model("User", userSchema);
  await User.init();
  return {
    findByEmail: async (email) => toPlain(await User.findOne({ email })),
    findById: async (id) => (mongoose.isValidObjectId(id) ? toPlain(await User.findById(id)) : null),
    create: async (u) => toPlain(await User.create(u)),
    update: async (id, patch) => {
      const set = {};
      for (const [k, v] of Object.entries(patch)) {
        if (k === "twoFactor") for (const [k2, v2] of Object.entries(v)) set[`twoFactor.${k2}`] = v2;
        else set[k] = v;
      }
      return toPlain(await User.findByIdAndUpdate(id, { $set: set }, { new: true }));
    },
  };
}
