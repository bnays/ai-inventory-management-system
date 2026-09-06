import * as React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

import { apiRequest } from '@/lib/api-client';
import { Notifications } from './notifications';

// The AI-generated notification preferences form only needs to track the
// checkbox state and forward it to the backend on submit -- apiRequest is
// mocked so we can inspect exactly what payload gets sent, without needing
// a real server.
jest.mock('@/lib/api-client', () => ({
  apiRequest: jest.fn(),
}));

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('Notifications settings form (FE3)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('submits the current checkbox state as the notification-preferences payload', async () => {
    mockApiRequest.mockResolvedValue({ success: true });

    render(<Notifications />);

    // Checkboxes appear in a fixed order per the existing layout: Email
    // column (Product updates, Security updates) then Phone column (Email,
    // Security updates). Defaults match what's on screen today: the first
    // checkbox in each column starts checked, the second starts unchecked.
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(4);
    const [emailProduct, emailSecurity, phoneProduct, phoneSecurity] = checkboxes;

    expect(emailProduct).toBeChecked();
    expect(emailSecurity).not.toBeChecked();
    expect(phoneProduct).toBeChecked();
    expect(phoneSecurity).not.toBeChecked();

    // Flip one preference before saving, to prove the submitted payload
    // reflects live component state rather than the original defaults.
    fireEvent.click(emailSecurity);
    expect(emailSecurity).toBeChecked();

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledTimes(1);
    });

    const [endpoint, options] = mockApiRequest.mock.calls[0];
    expect(endpoint).toBe('/users/notification-preferences');
    expect(options).toMatchObject({ method: 'PUT' });
    expect(JSON.parse(options!.body as string)).toEqual({
      emailProductUpdates: true,
      emailSecurityUpdates: true,
      phoneProductUpdates: true,
      phoneSecurityUpdates: false,
    });
  });

  test('disables the save button while the request is in flight, then re-enables it (existing form convention)', async () => {
    let resolveSave: (value: unknown) => void;
    mockApiRequest.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        })
    );
    render(<Notifications />);

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeEnabled();

    fireEvent.click(saveButton);
    expect(saveButton).toBeDisabled();

    resolveSave!({ success: true });

    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
  });
});
