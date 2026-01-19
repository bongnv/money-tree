import React from 'react';
import { People as PeopleIcon } from '@mui/icons-material';
import {
  GoogleDriveProvider,
  GoogleDriveFileInfo,
} from '../../services/storage/GoogleDriveProvider';
import { driveApiConfig } from '../../config/googledrive.config';
import { CloudFilePicker, CloudItem } from '../common/CloudFilePicker';
import { useStorage } from '../../contexts/ServiceProviders';

interface GoogleDriveFilePickerProps {
  open: boolean;
  mode?: 'open' | 'create';
  onComplete: (hasExistingFile: boolean) => void;
  onCancel: () => void;
  defaultFileName?: string;
}

export const GoogleDriveFilePicker: React.FC<GoogleDriveFilePickerProps> = ({
  open,
  mode = 'open',
  onComplete,
  onCancel,
  defaultFileName = 'money-tree.json',
}) => {
  const storage = useStorage();
  const provider = storage.provider as GoogleDriveProvider;
  const handleListItems = async (parentId?: string | null): Promise<CloudItem[]> => {
    const driveFiles = await provider.listDriveFiles(parentId || undefined);

    // Convert to generic CloudItem format
    return driveFiles.map((file) => ({
      id: file.id,
      name: file.name,
      isFolder: file.mimeType === driveApiConfig.folderMimeType,
      additionalInfo: file.shared ? (
        <PeopleIcon fontSize="small" color="action" titleAccess="Shared" />
      ) : undefined,
    }));
  };

  const handleSelect = async (
    fileId: string | null,
    fileName: string,
    currentFolderId: string | null
  ) => {
    const fileInfo: GoogleDriveFileInfo = {
      fileId,
      fileName,
      parentId: currentFolderId || undefined,
    };

    // Set file on provider and cache it
    await provider.setFile(fileInfo);

    // Notify completion with whether it's an existing file
    onComplete(!!fileInfo.fileId);
  };

  return (
    <CloudFilePicker
      open={open}
      title="Select Google Drive File Location"
      mode={mode}
      onSelect={handleSelect}
      onCancel={onCancel}
      onListItems={handleListItems}
      defaultFileName={defaultFileName}
    />
  );
};
