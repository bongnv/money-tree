import React from 'react';
import { People as PeopleIcon } from '@mui/icons-material';
import type { SelectedFileInfo } from '../../services/storage/GoogleDriveProvider';
import type { DriveFile } from '../../services/storage/GoogleDriveService';
import { driveApiConfig } from '../../config/googledrive.config';
import { CloudFilePicker, CloudItem } from '../common/CloudFilePicker';

interface GoogleDriveFilePickerProps {
  open: boolean;
  mode?: 'open' | 'create';
  onSelect: (fileInfo: SelectedFileInfo) => void;
  onCancel: () => void;
  onListFiles: (parentId?: string) => Promise<DriveFile[]>;
  defaultFileName?: string;
}

export const GoogleDriveFilePicker: React.FC<GoogleDriveFilePickerProps> = ({
  open,
  mode = 'open',
  onSelect,
  onCancel,
  onListFiles,
  defaultFileName = 'money-tree.json',
}) => {
  const handleListItems = async (parentId?: string | null): Promise<CloudItem[]> => {
    const driveFiles = await onListFiles(parentId || undefined);

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

  const mapToFileInfo = (
    fileId: string | null,
    fileName: string,
    currentFolderId?: string | null
  ): SelectedFileInfo => {
    return {
      fileId,
      fileName,
      parentId: currentFolderId || undefined,
    };
  };

  return (
    <CloudFilePicker
      open={open}
      title="Select Google Drive File Location"
      mode={mode}
      onSelect={onSelect}
      onCancel={onCancel}
      onListItems={handleListItems}
      defaultFileName={defaultFileName}
      mapToFileInfo={mapToFileInfo}
    />
  );
};
