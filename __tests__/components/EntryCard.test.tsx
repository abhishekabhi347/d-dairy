import { render, screen, userEvent } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { EntryCard } from '@/components/entry/EntryCard';
import { makeEntry, NOW } from '../helpers/factories';
import { TestProviders } from '../helpers/TestProviders';

const ENTRY = makeEntry({
  id: 'entry_card',
  title: 'A slow Sunday',
  body: 'Rain on the window and a warm cup of tea.',
  mood: 'good',
  tags: ['mindfulness', 'self-care', 'quiet'],
  favorite: true,
  createdAt: NOW,
});

describe('EntryCard', () => {
  it('shows the title, excerpt, mood, tags, and word count', async () => {
    await renderWithProviders(<EntryCard entry={ENTRY} onPress={jest.fn()} />);

    expect(await screen.findByText('A slow Sunday')).toBeTruthy();
    expect(screen.getByText('Rain on the window and a warm cup of tea.')).toBeTruthy();
    expect(screen.getByText('Good')).toBeTruthy();
    expect(screen.getByText('Mindfulness')).toBeTruthy();
    expect(screen.getByText('Self-care')).toBeTruthy();
    expect(screen.getByText('+1')).toBeTruthy();
    expect(screen.getByText('10 words')).toBeTruthy();
  });

  it('uses derived titles and a quiet empty state for untitled pages', async () => {
    const entry = makeEntry({
      id: 'entry_derived',
      title: '',
      body: 'First line of the day\nMore words',
      tags: [],
      mood: null,
    });
    await renderWithProviders(<EntryCard entry={entry} onPress={jest.fn()} />);

    expect(await screen.findByText('First line of the day')).toBeTruthy();
    expect(screen.getByText('Entry')).toBeTruthy();
    expect(screen.getByText('7 words')).toBeTruthy();
  });

  it('opens the entry when pressed', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<EntryCard entry={ENTRY} onPress={onPress} compact />);

    await userEvent.press(await screen.findByRole('button', { name: 'Open A slow Sunday' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('hides the excerpt in compact mode', async () => {
    await renderWithProviders(<EntryCard entry={ENTRY} onPress={jest.fn()} compact />);

    expect(await screen.findByText('A slow Sunday')).toBeTruthy();
    expect(screen.queryByText('Rain on the window and a warm cup of tea.')).toBeNull();
  });
});

function renderWithProviders(element: ReactElement) {
  return render(<TestProviders>{element}</TestProviders>);
}
