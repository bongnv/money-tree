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
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  NavigateNext as NavigateNextIcon,
  Cloud as CloudIcon,
} from '@mui/icons-material';

// Generic file/folder interface for cloud providers
export interface CloudItem {
  id: string;
  name: string;
  isFolder: boolean;
  additionalInfo?: React.ReactNode; // For provider-specific icons/badges
}

export interface CloudFileInfo {
  fileId: string | null;
  fileName?: string;
  [key: string]: any; // Allow provider-specific fields
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface CloudFilePickerProps<TFileInfo extends CloudFileInfo> {
  open: boolean;
  title: string;
  rootName?: string;
  onSelect: (fileInfo: TFileInfo) => void;
  onCancel: () => void;
  onListItems: (parentId?: string | null) => Promise<CloudItem[]>;
  defaultFileName?: string;
  mapToFileInfo: (
    fileId: string | null,
    fileName: string,
    currentFolderId?: string | null,
    breadcrumbs?: BreadcrumbItem[]
  ) => TFileInfo;
}

export function CloudFilePicker<TFileInfo extends CloudFileInfo>({
  open,
  title,
  rootName = 'My Drive',
  onSelect,
  onCancel,
  onListItems,
  defaultFileName = 'money-tree.json',
  mapToFileInfo,
}: CloudFilePickerProps<TFileInfo>) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [items, setItems] = useState<CloudItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<CloudItem | null>(null);
  const [showFileNameDialog, setShowFileNameDialog] = useState(false);
  const [newFileName, setNewFileName] = useState(defaultFileName);

  // Load root folder on open
  useEffect(() => {
    if (open) {
      loadFolder(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadFolder = async (folderId: string | null) => {
    setLoading(true);
    setError(null);
    setSelectedFile(null);

    try {
      const folderItems = await onListItems(folderId);
      setItems(folderItems);

      // Update breadcrumbs
      if (folderId === null) {
        // Root folder
        setBreadcrumbs([{ id: 'root', name: rootName }]);
        setCurrentFolderId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folder contents');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = async (folder: CloudItem) => {
    setLoading(true);
    setError(null);

    try {
      const folderItems = await onListItems(folder.id);
      setItems(folderItems);
      setCurrentFolderId(folder.id);
      setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folder contents');
    } finally {
      setLoading(false);
    }
  };

  const handleBreadcrumbClick = async (index: number) => {
    const targetBreadcrumb = breadcrumbs[index];
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);

    setLoading(true);
    setError(null);

    try {
      const folderId = targetBreadcrumb.id === 'root' ? null : targetBreadcrumb.id;
      const folderItems = await onListItems(folderId);
      setItems(folderItems);
      setCurrentFolderId(folderId);
      setBreadcrumbs(newBreadcrumbs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folder contents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file: CloudItem) => {
    setSelectedFile(file);
  };

  const handleSelectFile = () => {
    if (selectedFile) {
      // Existing file selected
      const fileInfo = mapToFileInfo(
        selectedFile.id,
        selectedFile.name,
        currentFolderId,
        breadcrumbs
      );
      onSelect(fileInfo);
    }
  };

  const handleCreateHere = () => {
    // Create new file in current folder
    const fileInfo = mapToFileInfo(null, newFileName, currentFolderId, breadcrumbs);
    onSelect(fileInfo);
    setShowFileNameDialog(false);
  };

  const handleCreateClick = () => {
    setNewFileName(defaultFileName);
    setShowFileNameDialog(true);
  };

  const handleFileNameDialogClose = () => {
    setShowFileNameDialog(false);
    setNewFileName(defaultFileName);
  };

  // Filter items into folders and JSON files
  const jsonFiles = items.filter((item) => !item.isFolder);
  const folders = items.filter((item) => item.isFolder);

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudIcon color="primary" />
          <Typography variant="h6">{title}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

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
                        {folder.additionalInfo}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}

            {/* JSON Files */}
            {jsonFiles.map((file) => (
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
                        {file.additionalInfo}
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
                  This folder is empty
                </Typography>
              </Box>
            )}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={handleCreateClick} disabled={loading}>
          Create File
        </Button>
        <Button variant="contained" onClick={handleSelectFile} disabled={!selectedFile || loading}>
          Select File
        </Button>
      </DialogActions>

      {/* File Name Dialog */}
      <Dialog open={showFileNameDialog} onClose={handleFileNameDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New File</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="File name"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            helperText="File must have .json extension"
            error={!newFileName.endsWith('.json')}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFileNameDialogClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateHere}
            disabled={!newFileName.trim() || !newFileName.endsWith('.json')}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
