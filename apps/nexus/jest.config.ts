export default {
  displayName: 'nexus',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  // uuid v13 ships ESM only; let ts-jest downlevel it instead of failing to parse it
  transformIgnorePatterns: ['node_modules/(?!uuid/)'],
  moduleNameMapper: {
    '^@daily/(.*)$': '<rootDir>/src/daily/$1',
    '^@okr/(.*)$': '<rootDir>/src/okr/$1',
    '^@notification/(.*)$': '<rootDir>/src/notification/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  coverageDirectory: '../../coverage/apps/nexus',
};
