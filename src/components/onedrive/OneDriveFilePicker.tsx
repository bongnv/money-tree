import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Breadcrumbs,
  Link,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TextField,
  Divider,
  RadioGroup,
  Radio,
  FormControlLabel,
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  NavigateNext as NavigateNextIcon,
  CloudQueue as CloudIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

export interface DriveItem {
  id: string;
  name: string;
  folder?: { childCount: number };
  file?: { mimeType: string };
  parentReference?: {
    id: string;
    path: string;
    driveId?: string;
  };
  remoteItem?: {
    id: string;
    name: string;
    parentReference?: {
      driveId: string;
    };
  };
}

export interface SelectedFileInfo {
  fileId: string;
  filePath: string;
  fileName: string;
  isNew: boolean;
}

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
  const [currentFolder, setCurrentFolder] = useState<DriveItem | null>(null);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<'existing' | 'new'>('new');
  const [selectedFile, setSelectedFile] = useState<DriveItem | null>(null);
  const [newFileName, setNewFileName] = useState(defaultFileName);

  // Load root folder on open
  useEffect(() => {
    if (open) {
      loadFolder();
    }
  }, [open]);

  const loadFolder = async (folderItem?: DriveItem | null) => {
    setLoading(true);
    setError(null);
    setSelectedFile(null);

    try {
      const folderItems = await onListFolders(folderItem);
      setItems(folderItems);

      // Update breadcrumbs
      if (!folderItem) {
        // Root folder
        setBreadcrumbs([{ id: 'root', name: 'OneDrive', folder: { childCount: 0 } }]);
        setCurrentFolder({ id: 'root', name: 'OneDrive', folder: { childCount: 0 } });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folder contents');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = async (folder: DriveItem) => {
    setLoading(true);
    setError(null);

    try {
      const folderItems = await onListFolders(folder);
      setItems(folderItems);
      setCurrentFolder(folder);
      setBreadcrumbs([...breadcrumbs, folder]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folder contents');
    } finally {
      setLoading(false);
    }
  };

  const handleBreadcrumbClick = async (index: number) => {
    const targetFolder = breadcrumbs[index];
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);

    setLoading(true);
    setError(null);

    try {
      const folderItem = targetFolder.id === 'root' ? null : targetFolder;
      const folderItems = await onListFolders(folderItem);
      setItems(folderItems);
      setCurrentFolder(targetFolder);
      setBreadcrumbs(newBreadcrumbs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folder contents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file: DriveItem) => {
    if (selectionMode === 'existing') {
      setSelectedFile(file);
    }
  };

  const handleSelect = () => {
    if (selectionMode === 'existing' && selectedFile) {
      // Existing file selected
      const filePath = selectedFile.parentReference?.path
        ? `${selectedFile.parentReference.path}/${selectedFile.name}`
        : `/${selectedFile.name}`;

      onSelect({
        fileId: selectedFile.id,
        filePath,
        fileName: selectedFile.name,
        isNew: false,
      });
    } else if (selectionMode === 'new' && currentFolder) {
      // Create new file in current folder
      const folderPath = breadcrumbs.map((b) => b.name).join('/');
      const filePath = `${folderPath}/${newFileName}`;

      onSelect({
        fileId: 'new', // Will be created on first save
        filePath,
        fileName: newFileName,
        isNew: true,
      });
    }
  };

  const isSelectDisabled = () => {
    if (selectionMode === 'existing') {
      return !selectedFile;
    } else {
      return !newFileName.trim() || !newFileName.endsWith('.json');
    }
  };

  const jsonFiles = items.filter((item) => item.file && item.name.endsWith('.json'));
  const folders = items.filter((item) => item.folder);

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudIcon color="primary" />
          <Typography variant="h6">Select OneDrive File Location</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Selection Mode */}
        <Box sx={{ mb: 2 }}>
          <RadioGroup
            value={selectionMode}
            onChange={(e) => setSelectionMode(e.target.value as 'existing' | 'new')}
            row
          >
            <FormControlLabel value="new" control={<Radio />} label="Create new file" />
            <FormControlLabel value="existing" control={<Radio />} label="Select existing file" />
          </RadioGroup>
        </Box>

        {/* Breadcrumbs */}
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
          {breadcrumbs.map((crumb, index) => (
            <Link
              key={crumb.id}
              component="button"
              variant="body2"
              onClick={() => handleBreadcrumbClick(index)}
              sx={{
                cursor: 'pointer',
                fontWeight: index === breadcrumbs.length - 1 ? 'bold' : 'normal',
              }}
            >
              {crumb.name}
            </Link>
          ))}
        </Breadcrumbs>

        {/* New File Name Input */}
        {selectionMode === 'new' && (
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="File name"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              helperText="File must have .json extension"
              error={!newFileName.endsWith('.json')}
            />
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Folder/File List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {/* Folders */}
            {folders.map((folder) => (
              <ListItem key={folder.id} disablePadding>
                <ListItemButton onClick={() => handleFolderClick(folder)}>
                  <ListItemIcon>
                    <FolderIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{folder.name}</span>
                        {folder.remoteItem && (
                          <PeopleIcon fontSize="small" color="action" titleAccess="Shared folder" />
                        )}
                      </Box>
                    }
                    secondary={`${folder.folder?.childCount || 0} items`}
                  />
                </ListItemButton>
              </ListItem>
            ))}

            {/* JSON Files (only in "existing" mode) */}
            {selectionMode === 'existing' &&
              jsonFiles.map((file) => (
                <ListItem key={file.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleFileClick(file)}
                    selected={selectedFile?.id === file.id}
                  >
                    <ListItemIcon>
                      <FileIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{file.name}</span>
                          {file.remoteItem && (
                            <PeopleIcon fontSize="small" color="action" titleAccess="Shared file" />
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}

            {/* Empty state */}
            {folders.length === 0 && jsonFiles.length === 0 && (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {selectionMode === 'existing'
                    ? 'No .json files found in this folder'
                    : 'This folder is empty'}
                </Typography>
              </Box>
            )}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={handleSelect} disabled={isSelectDisabled() || loading}>
          {selectionMode === 'existing' ? 'Select File' : 'Create Here'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
