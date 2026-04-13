const nextJest = require('next/jest')

const createJestConfig = nextJest({
    dir: './',
})

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    roots: ['<rootDir>/src'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^react-markdown$': '<rootDir>/src/test/mocks/react-markdown.tsx',
    },
}

module.exports = createJestConfig(customJestConfig)
