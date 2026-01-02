import { Challenge } from '../../types/apps/challenge';

export const challenges: Challenge[] = [
  {
    id: 'sum-array',
    title: 'Sum Array Elements',
    description: 'Write a function that takes an array of numbers and returns their sum.',
    initialCode: `function sumArray(numbers) {
  // Your code here
}`,
    testCases: [
      {
        input: [[1, 2, 3, 4, 5]],
        expected: 15,
        description: 'Should sum positive numbers'
      },
      {
        input: [[-1, -2, -3]],
        expected: -6,
        description: 'Should sum negative numbers'
      },
      {
        input: [[0]],
        expected: 0,
        description: 'Should handle zero'
      }
    ]
  }
];
