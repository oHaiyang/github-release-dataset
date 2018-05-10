export default function GitHub() {
  const repos = {};
  const mockReleases = {};

  function __setReleases(tag, note) {
    mockReleases[tag] = note;
  }

  const editRelease = jest.fn(async () => {});

  const authenticate = jest.fn(() => {});

  const getReleaseByTag = jest.fn(async ({ tag }) => {
     return mockRelease[tag]; 
  })

  return {
    authenticate,
    repos: {
      editRelease,
      getReleaseByTag,
    },
  }
}
