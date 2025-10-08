'use server';

/**
 * @fileOverview This file defines a Genkit flow for adaptive difficulty scaling in a game.
 *
 * The flow takes player performance data as input and returns adjustments to game difficulty parameters.
 * It exports:
 * - `adjustDifficulty`: The main function to trigger the difficulty adjustment flow.
 * - `AdjustDifficultyInput`: The input type for the adjustDifficulty function.
 * - `AdjustDifficultyOutput`: The return type for the adjustDifficulty function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdjustDifficultyInputSchema = z.object({
  score: z.number().describe('The player score.'),
  distanceTraveled: z.number().describe('The distance the player has traveled.'),
  coinsCollected: z.number().describe('The number of coins the player has collected.'),
  timeElapsed: z.number().describe('The time elapsed since the game started in seconds.'),
});
export type AdjustDifficultyInput = z.infer<typeof AdjustDifficultyInputSchema>;

const AdjustDifficultyOutputSchema = z.object({
  gameSpeedMultiplier: z
    .number()
    .describe(
      'A multiplier to adjust the overall game speed. Higher values increase the speed.'
    ),
  obstacleFrequency: z
    .number()
    .describe(
      'A value to adjust the frequency of obstacles. Higher values increase the frequency.'
    ),
  obstacleVelocityMultiplier: z
    .number()
    .describe(
      'A multiplier to adjust the velocity of obstacles. Higher values increase the velocity.'
    ),
});
export type AdjustDifficultyOutput = z.infer<typeof AdjustDifficultyOutputSchema>;

export async function adjustDifficulty(
  input: AdjustDifficultyInput
): Promise<AdjustDifficultyOutput> {
  return adjustDifficultyFlow(input);
}

const adjustDifficultyPrompt = ai.definePrompt({
  name: 'adjustDifficultyPrompt',
  input: {schema: AdjustDifficultyInputSchema},
  output: {schema: AdjustDifficultyOutputSchema},
  prompt: `You are an expert game difficulty scaler. You will receive information about the player\'s performance in a game, and you will output a JSON object containing adjustments to the game\'s difficulty parameters.\n
Score: {{{score}}}\nDistance Traveled: {{{distanceTraveled}}}\nCoins Collected: {{{coinsCollected}}}\nTime Elapsed: {{{timeElapsed}}}\n
Based on this information, set the following parameters to make the game challenging but not frustrating:\n
- gameSpeedMultiplier: A multiplier to adjust the overall game speed. Higher values increase the speed. Start at 1.0.\n- obstacleFrequency: A value to adjust the frequency of obstacles. Higher values increase the frequency. Start at 1.0.\n- obstacleVelocityMultiplier: A multiplier to adjust the velocity of obstacles. Higher values increase the velocity. Start at 1.0.\n
Consider the following:\n* If the player has a high score, has traveled a long distance, and has collected many coins, increase the difficulty by increasing the game speed, obstacle frequency, and obstacle velocity.\n* If the player has a low score, has traveled a short distance, and has collected few coins, decrease the difficulty by decreasing the game speed, obstacle frequency, and obstacle velocity.\n* The game should always be challenging but not frustrating. Make small adjustments to the difficulty parameters.\n* The player should feel like they are always improving. Do not make the game too easy or too hard.\n`,
});

const adjustDifficultyFlow = ai.defineFlow(
  {
    name: 'adjustDifficultyFlow',
    inputSchema: AdjustDifficultyInputSchema,
    outputSchema: AdjustDifficultyOutputSchema,
  },
  async input => {
    const {output} = await adjustDifficultyPrompt(input);
    return output!;
  }
);
