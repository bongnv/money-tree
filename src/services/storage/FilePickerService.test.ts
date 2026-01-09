/**
 * FilePickerService Tests
 */

import { FilePickerService } from './FilePickerService';

describe('FilePickerService', () => {
  describe('isFileSystemAccessSupported', () => {
    it('should return true when File System Access API is available', () => {
      // Mock the API being available
      (window as any).showOpenFilePicker = jest.fn();
      (window as any).showSaveFilePicker = jest.fn();

      expect(FilePickerService.isFileSystemAccessSupported()).toBe(true);
    });

    it('should return false when File System Access API is not available', () => {
      // Remove the API
      delete (window as any).showOpenFilePicker;
      delete (window as any).showSaveFilePicker;

      expect(FilePickerService.isFileSystemAccessSupported()).toBe(false);
    });
  });

  describe('showOpenFilePicker', () => {
    beforeEach(() => {
      // Mock the API being available
      (window as any).showOpenFilePicker = jest.fn();
      (window as any).showSaveFilePicker = jest.fn();
    });

    it('should throw error when API is not supported', async () => {
      // Remove the API
      delete (window as any).showOpenFilePicker;
      delete (window as any).showSaveFilePicker;

      await expect(FilePickerService.showOpenFilePicker()).rejects.toThrow(
        'File System Access API is not supported'
      );
    });

    it('should return file handle when file is selected', async () => {
      const mockFileHandle = { name: 'test.json' } as FileSystemFileHandle;
      (window as any).showOpenFilePicker = jest.fn().mockResolvedValue([mockFileHandle]);

      const result = await FilePickerService.showOpenFilePicker();

      expect(result).toBe(mockFileHandle);
      expect(window.showOpenFilePicker).toHaveBeenCalledWith({
        types: [
          {
            description: 'Money Tree Data',
            accept: {
              'application/json': ['.json'],
            },
          },
        ],
        multiple: false,
      });
    });

    it('should return null when user cancels', async () => {
      const abortError = new DOMException('User cancelled', 'AbortError');
      (window as any).showOpenFilePicker = jest.fn().mockRejectedValue(abortError);

      const result = await FilePickerService.showOpenFilePicker();

      expect(result).toBeNull();
    });

    it('should throw non-abort errors', async () => {
      const error = new Error('Something went wrong');
      (window as any).showOpenFilePicker = jest.fn().mockRejectedValue(error);

      await expect(FilePickerService.showOpenFilePicker()).rejects.toThrow('Something went wrong');
    });
  });

  describe('showSaveFilePicker', () => {
    beforeEach(() => {
      // Mock the API being available
      (window as any).showOpenFilePicker = jest.fn();
      (window as any).showSaveFilePicker = jest.fn();
    });

    it('should throw error when API is not supported', async () => {
      // Remove the API
      delete (window as any).showOpenFilePicker;
      delete (window as any).showSaveFilePicker;

      await expect(FilePickerService.showSaveFilePicker('test.json')).rejects.toThrow(
        'File System Access API is not supported'
      );
    });

    it('should return file handle when file is selected', async () => {
      const mockFileHandle = { name: 'test.json' } as FileSystemFileHandle;
      (window as any).showSaveFilePicker = jest.fn().mockResolvedValue(mockFileHandle);

      const result = await FilePickerService.showSaveFilePicker('test.json');

      expect(result).toBe(mockFileHandle);
      expect(window.showSaveFilePicker).toHaveBeenCalledWith({
        suggestedName: 'test.json',
        types: [
          {
            description: 'JSON File',
            accept: {
              'application/json': ['.json'],
            },
          },
        ],
      });
    });

    it('should return null when user cancels', async () => {
      const abortError = new DOMException('User cancelled', 'AbortError');
      (window as any).showSaveFilePicker = jest.fn().mockRejectedValue(abortError);

      const result = await FilePickerService.showSaveFilePicker('test.json');

      expect(result).toBeNull();
    });

    it('should throw non-abort errors', async () => {
      const error = new Error('Something went wrong');
      (window as any).showSaveFilePicker = jest.fn().mockRejectedValue(error);

      await expect(FilePickerService.showSaveFilePicker('test.json')).rejects.toThrow(
        'Something went wrong'
      );
    });
  });
});
