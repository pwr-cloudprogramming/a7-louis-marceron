import { store } from "../utils/store";

export const registerUser = async (name: string) => {
  const user = <User>{
    userId: store.numberOfUsers++,
    name: name,
  }

  store.users.add(user);

  return user;
};
