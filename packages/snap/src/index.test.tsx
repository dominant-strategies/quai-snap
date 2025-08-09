import { expect } from '@jest/globals';
import type { SnapConfirmationInterface } from '@metamask/snaps-jest';
import { installSnap } from '@metamask/snaps-jest';
import { Box, Text, Bold } from '@metamask/snaps-sdk/jsx';

describe('onRpcRequest', () => {
  describe('hello', () => {
    it('shows a confirmation dialog', async () => {
      const { request } = await installSnap();

      const origin = 'Jest';
      const response = request({
        method: 'hello',
        origin,
      });

      const ui = (await response.getInterface()) as SnapConfirmationInterface;
      expect(ui.type).toBe('confirmation');
      expect(ui).toRender(
        <Box>
          <Text>
            Hello, <Bold>{origin}</Bold>!
          </Text>
          <Text>
            This demonstrates proper confirmation handling for secure wallet interactions.
          </Text>
        </Box>,
      );

      await ui.ok();

      expect(await response).toRespondWith('Hello request confirmed');
    });
  });

  it('throws an error if the requested method does not exist', async () => {
    const { request } = await installSnap();

    const response = await request({
      method: 'foo',
    });

    expect(response).toRespondWithError({
      code: -32603,
      message: 'Method foo not allowed',
      stack: expect.any(String),
    });
  });
});
