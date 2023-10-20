import { Model, ObjectId, Schema, model } from "mongoose";
import { hash, compare } from "bcrypt";

interface PasswordResetTokenDocument {
  owner: ObjectId;
  token: string;
  createdAt: Date;
}

interface PasswordResetTokenMethods {
  compareToken(token: string): Promise<boolean>;
}

const passwordResetTokenSchema = new Schema<
  PasswordResetTokenDocument,
  {},
  PasswordResetTokenMethods
>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      expires: 3_600,
      default: Date.now(),
    },
  },
  { timestamps: true }
);

passwordResetTokenSchema.pre("save", async function (next) {
  if (this.isModified("token")) {
    this.token = await hash(this.token, 10);
  }
  next();
});

passwordResetTokenSchema.methods.compareToken = async function (token) {
  const result = await compare(token, this.token);
  return result;
};

export default model("PasswordResetToken", passwordResetTokenSchema) as Model<
  PasswordResetTokenDocument,
  {},
  PasswordResetTokenMethods
>;
