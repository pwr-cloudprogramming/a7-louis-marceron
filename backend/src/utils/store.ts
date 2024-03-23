interface Store {
  users: Set<User>,
  queue: User[],
  numberOfUsers: number,
}

export const store: Store = {
  users: new Set<User>(),
  queue: [],
  numberOfUsers: 0,
}
