import { GooglePickerService } from './GooglePickerService';
import { googleDriveConfig } from '../../config/googledrive.config';

// Mock the Google Picker API
const mockPicker = {
  setVisible: jest.fn(),
};

const mockDocsView = {
  setIncludeFolders: jest.fn().mockReturnThis(),
  setSelectFolderEnabled: jest.fn().mockReturnThis(),
  setMimeTypes: jest.fn().mockReturnThis(),
};

const mockPickerBuilder = {
  addView: jest.fn().mockReturnThis(),
  setOAuthToken: jest.fn().mockReturnThis(),
  setDeveloperKey: jest.fn().mockReturnThis(),
  setCallback: jest.fn().mockReturnThis(),
  setTitle: jest.fn().mockReturnThis(),
  enableFeature: jest.fn().mockReturnThis(),
  build: jest.fn(() => mockPicker),
};

// Mock window.google and window.gapi
declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

describe('GooglePickerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Google Picker API
    window.google = {
      picker: {
        ViewId: {
          DOCS: 'all',
          FOLDERS: 'folders',
        },
        Action: {
          PICKED: 'picked',
          CANCEL: 'cancel',
        },
        Feature: {
          MULTISELECT_ENABLED: 'multiselectEnabled',
        },
        DocsView: jest.fn(() => mockDocsView),
        PickerBuilder: jest.fn(() => mockPickerBuilder),
      },
    };

    // Mock gapi
    window.gapi = {
      load: jest.fn((apiName: string, callback: any) => {
        if (typeof callback === 'function') {
          callback();
        } else {
          callback.callback();
        }
      }),
    };
  });

  afterEach(() => {
    delete window.google;
    delete window.gapi;
  });

  describe('showPicker', () => {
    it('should load picker API and show picker', async () => {
      const accessToken = 'test-token';

      // Don't await yet, just start the promise
      const pickerPromise = GooglePickerService.showPicker(accessToken);

      // Wait a tick for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Get the callback that was set
      const callbackCall = mockPickerBuilder.setCallback.mock.calls[0];
      expect(callbackCall).toBeDefined();
      const callback = callbackCall[0];

      // Simulate user selecting a file
      callback({
        action: 'picked',
        docs: [
          {
            id: 'file123',
            name: 'test.json',
            mimeType: 'application/json',
            parentId: 'parent123',
          },
        ],
      });

      const result = await pickerPromise;

      expect(result).toEqual({
        id: 'file123',
        name: 'test.json',
        mimeType: 'application/json',
        parentId: 'parent123',
      });

      expect(window.gapi.load).toHaveBeenCalledWith(
        'picker',
        expect.objectContaining({
          callback: expect.any(Function),
          onerror: expect.any(Function),
        })
      );
      expect(mockPickerBuilder.setOAuthToken).toHaveBeenCalledWith(accessToken);
      expect(mockPickerBuilder.setDeveloperKey).toHaveBeenCalledWith(googleDriveConfig.apiKey);
      expect(mockPicker.setVisible).toHaveBeenCalledWith(true);
    });

    it('should return null when user cancels', async () => {
      const accessToken = 'test-token';
      const pickerPromise = GooglePickerService.showPicker(accessToken);

      // Wait a tick
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Get the callback
      const callback = mockPickerBuilder.setCallback.mock.calls[0][0];

      // Simulate user cancelling
      callback({
        action: 'cancel',
      });

      const result = await pickerPromise;

      expect(result).toBeNull();
    });

    it('should return null when no document selected', async () => {
      const accessToken = 'test-token';
      const pickerPromise = GooglePickerService.showPicker(accessToken);

      // Wait a tick
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Get the callback
      const callback = mockPickerBuilder.setCallback.mock.calls[0][0];

      // Simulate picked action but no docs
      callback({
        action: 'picked',
        docs: [],
      });

      const result = await pickerPromise;

      expect(result).toBeNull();
    });

    it('should configure picker with DocsView and folders', async () => {
      const accessToken = 'test-token';
      const pickerPromise = GooglePickerService.showPicker(accessToken);

      // Wait a tick
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Simulate cancel to resolve promise
      const callback = mockPickerBuilder.setCallback.mock.calls[0][0];
      callback({ action: 'cancel' });

      await pickerPromise;

      expect(window.google.picker.DocsView).toHaveBeenCalled();
      expect(mockDocsView.setIncludeFolders).toHaveBeenCalledWith(true);
      expect(mockDocsView.setSelectFolderEnabled).toHaveBeenCalledWith(true);
      expect(mockDocsView.setMimeTypes).toHaveBeenCalledWith(
        'application/json,application/vnd.google-apps.folder'
      );
      expect(mockPickerBuilder.addView).toHaveBeenCalledWith(mockDocsView);
      expect(mockPickerBuilder.addView).toHaveBeenCalledWith('folders');
    });

    it('should enable multiselect when allowCreate is true', async () => {
      const accessToken = 'test-token';
      const pickerPromise = GooglePickerService.showPicker(accessToken, true);

      // Wait a tick
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Simulate cancel
      const callback = mockPickerBuilder.setCallback.mock.calls[0][0];
      callback({ action: 'cancel' });

      await pickerPromise;

      expect(mockPickerBuilder.enableFeature).toHaveBeenCalledWith('multiselectEnabled');
    });

    it('should not enable multiselect when allowCreate is false', async () => {
      const accessToken = 'test-token';
      const pickerPromise = GooglePickerService.showPicker(accessToken, false);

      // Wait a tick
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Simulate cancel
      const callback = mockPickerBuilder.setCallback.mock.calls[0][0];
      callback({ action: 'cancel' });

      await pickerPromise;

      expect(mockPickerBuilder.enableFeature).not.toHaveBeenCalled();
    });

    it('should handle file without parentId', async () => {
      const accessToken = 'test-token';
      const pickerPromise = GooglePickerService.showPicker(accessToken);

      // Wait a tick
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Get the callback
      const callback = mockPickerBuilder.setCallback.mock.calls[0][0];

      // Simulate selecting file without parentId
      callback({
        action: 'picked',
        docs: [
          {
            id: 'file123',
            name: 'test.json',
            mimeType: 'application/json',
          },
        ],
      });

      const result = await pickerPromise;

      expect(result).toEqual({
        id: 'file123',
        name: 'test.json',
        mimeType: 'application/json',
        parentId: undefined,
      });
    });

    it('should reuse loaded picker API on subsequent calls', async () => {
      const accessToken1 = 'test-token-1';
      const pickerPromise1 = GooglePickerService.showPicker(accessToken1);

      await new Promise((resolve) => setTimeout(resolve, 0));
      const callback1 = mockPickerBuilder.setCallback.mock.calls[0][0];
      callback1({ action: 'cancel' });
      await pickerPromise1;

      const loadCallCount = window.gapi.load.mock.calls.length;

      // Second call should reuse loaded API
      const accessToken2 = 'test-token-2';
      const pickerPromise2 = GooglePickerService.showPicker(accessToken2);

      await new Promise((resolve) => setTimeout(resolve, 0));
      const callback2 = mockPickerBuilder.setCallback.mock.calls[1][0];
      callback2({ action: 'cancel' });
      await pickerPromise2;

      expect(window.gapi.load.mock.calls.length).toBe(loadCallCount);
    });
  });
});
