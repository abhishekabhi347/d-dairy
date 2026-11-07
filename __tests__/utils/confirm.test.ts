import { Alert, Platform } from 'react-native';

import { confirmDestructive } from '@/utils/confirm';

describe('confirmDestructive', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses a browser confirm on web and calls back when accepted', () => {
    const confirm = jest.fn(() => true);
    const onConfirm = jest.fn();
    const originalConfirm = globalThis.confirm;

    jest.replaceProperty(Platform, 'OS', 'web');
    globalThis.confirm = confirm;

    try {
      confirmDestructive('Delete page', 'This cannot be undone.', onConfirm);
      expect(confirm).toHaveBeenCalledWith('Delete page\n\nThis cannot be undone.');
      expect(onConfirm).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.confirm = originalConfirm;
    }
  });

  it('does nothing on web when the dialog is dismissed', () => {
    const onConfirm = jest.fn();
    const originalConfirm = globalThis.confirm;

    jest.replaceProperty(Platform, 'OS', 'web');
    globalThis.confirm = () => false;

    try {
      confirmDestructive('Delete page', 'This cannot be undone.', onConfirm);
      expect(onConfirm).not.toHaveBeenCalled();
    } finally {
      globalThis.confirm = originalConfirm;
    }
  });

  it('proceeds on web when no confirm dialog exists', () => {
    const onConfirm = jest.fn();
    const originalConfirm = globalThis.confirm;

    jest.replaceProperty(Platform, 'OS', 'web');
    // @ts-expect-error — simulating an environment without a confirm dialog
    delete globalThis.confirm;

    try {
      confirmDestructive('Delete page', 'This cannot be undone.', onConfirm);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.confirm = originalConfirm;
    }
  });

  it('uses a native destructive alert on mobile', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const onConfirm = jest.fn();

    confirmDestructive('Delete page', 'This cannot be undone.', onConfirm);

    expect(alert).toHaveBeenCalledTimes(1);
    const [, message, buttons] = alert.mock.calls[0];
    expect(message).toBe('This cannot be undone.');
    expect(buttons?.map((button) => button.style)).toEqual([ 'cancel', 'destructive' ]);
    buttons?.find((button) => button.style === 'destructive')?.onPress?.();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
