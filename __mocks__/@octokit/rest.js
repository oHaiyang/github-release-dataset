/* eslint-env jest */
export default function GitHub() {
  const editRelease = jest.fn(async () => {});

  const authenticate = jest.fn(() => {});

  const getReleaseByTag = jest.fn(async () => {});

  return {
    authenticate,
    repos: {
      editRelease,
      getReleaseByTag,
    },
  };
}
