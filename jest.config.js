module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/utils'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
