import React, { useRef } from 'react';
import { People as PeopleIcon } from '@mui/icons-material';
import type { SelectedFileInfo } from '../../services/storage/OneDriveProvider';
import type { DriveItem } from '../../services/storage/OneDriveService';
import { CloudFilePicker, CloudItem } from '../common/CloudFilePicker';

interface OneDriveFilePickerProps {
  open: boolean;
  onSelect: (fileInfo: SelectedFileInfo) => void;
  onCancel: () => void;
  onListFolders: (parentItem?: DriveItem | null) => Promise<DriveItem[]>;
  defaultFileName?: string;
}

export const OneDriveFilePicker: React.FC<OneDriveFilePickerProps> = ({
  open,
  onSelect,
  onCancel,
  onListFolders,
  defaultFileName = 'money-tree.json',
}) => {
  // Store current folder context for create operations
  const currentFolderRef = useRef<DriveItem | null>(null);
  const itemsMapRef = useRef<Map<string, DriveItem>>(new Map());

  const handleListItems = async (parentId?: string | null): Promise<CloudItem[]> => {
    // Convert parentId back to DriveItem - OneDrive expects undefined for root, not null
    const parentItem = parentId ? itemsMapRef.current.get(parentId) : undefined;
    const driveItems = await onListFolders(parentItem);

    // Update current folder reference
    if (parentId === null) {
      currentFolderRef.current = { id: 'root', name: 'OneDrive', folder: { childCount: 0 } };
    } else {
      currentFolderRef.current = parentItem || null;
    }

    // Clear and rebuild items map
    itemsMapRef.current.clear();
    driveItems.forEach((item) => {
      itemsMapRef.current.set(item.id, item);
    });

    // Convert to generic CloudItem format
    return driveItems.map((item) => ({
      id: item.id,
      name: item.name,
      isFolder: !!item.folder,
      additionalInfo: item.remoteItem ? (
        <PeopleIcon fontSize="small" color="action" titleAccess="Shared" />
      ) : undefined,
    }));
  };

  const mapToFileInfo = (
    fileId: string | null,
    fileName: string,
    _currentFolderId?: string | null,
    breadcrumbs?: Array<{ id: string; name: string }>
  ): SelectedFileInfo => {
    if (fileId) {
      // Existing file selected
      const driveItem = itemsMapRef.current.get(fileId);
      const filePath = driveItem?.parentReference?.path
        ? `${driveItem.parentReference.path}/${fileName}`
        : `/${fileName}`;

      // Determine if we're in a shared folder
      const isSharedFolder = currentFolderRef.current?.remoteItem !== undefined;
      const driveId = isSharedFolder
        ? currentFolderRef.current?.remoteItem?.parentReference?.driveId
        : undefined;

      return {
        fileId,
        filePath,
        driveId,
        parentItemId: driveItem?.parentReference?.id,
      };
    } else {
      // Create new file
      // Skip the root 'My Drive' breadcrumb (index 0) when building the path
      const folderPath = breadcrumbs
        ? breadcrumbs
            .slice(1)
            .map((b) => b.name)
            .join('/')
        : '';
      const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

      // Determine if we're in a shared folder
      const isSharedFolder = currentFolderRef.current?.remoteItem !== undefined;
      const driveId = isSharedFolder
        ? currentFolderRef.current?.remoteItem?.parentReference?.driveId
        : undefined;
      const parentItemId = isSharedFolder
        ? currentFolderRef.current?.remoteItem?.id || currentFolderRef.current?.id
        : undefined;

      return {
        fileId: null,
        filePath,
        driveId,
        parentItemId,
      };
    }
  };

  return (
    <CloudFilePicker
      open={open}
      title="Select OneDrive File Location"
      rootName="OneDrive"
      onSelect={onSelect}
      onCancel={onCancel}
      onListItems={handleListItems}
      defaultFileName={defaultFileName}
      mapToFileInfo={mapToFileInfo}
    />
  );
};
