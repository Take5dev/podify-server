import { Model, ObjectId, Schema, model } from "mongoose";
import { hash, compare } from "bcrypt";

interface EmailVerificationTokenDocument {
  owner: ObjectId;
  token: string;
  createdAt: Date;
}

interface EmailVerificationTokenMethods {
  compareToken(token: string): Promise<boolean>;
}

const emailVerificationTokenSchema = new Schema<
  EmailVerificationTokenDocument,
  {},
  EmailVerificationTokenMethods
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

emailVerificationTokenSchema.pre("save", async function (next) {
  if (this.isModified("token")) {
    this.token = await hash(this.token, 10);
  }
  next();
});

emailVerificationTokenSchema.methods.compareToken = async function (token) {
  const result = await compare(token, this.token);
  return result;
};

export default model(
  "EmailVerificationToken",
  emailVerificationTokenSchema
) as Model<EmailVerificationTokenDocument, {}, EmailVerificationTokenMethods>;
