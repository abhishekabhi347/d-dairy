import { render, screen, userEvent } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/Button';
import { TestProviders } from '../helpers/TestProviders';

describe('Button', () => {
  it('renders a labelled button and responds to presses', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Save page" onPress={onPress} />);

    const button = await screen.findByRole('button', { name: 'Save page' });
    await userEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire while disabled and exposes the disabled state', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Saving" onPress={onPress} disabled />);

    const button = await screen.findByRole('button', { name: 'Saving' });
    expect(button.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );

    await userEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});

function renderWithProviders(element: ReactElement) {
  return render(<TestProviders>{element}</TestProviders>);
}
