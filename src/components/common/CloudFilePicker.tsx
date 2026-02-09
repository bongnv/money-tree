import { useState, useEffect } from 'react';
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
  People as PeopleIcon,
} from '@mui/icons-material';
import type { CloudItem, IStorageProvider } from '../../services/storage/IStorageProvider';

interface CloudFilePickerProps {
  open: boolean;
  providerName: string;
  provider: IStorageProvider;
  onFileSelected: (fileItem: CloudItem) => void;
  onCancel: () => void;
  defaultFileName?: string;
}

export function CloudFilePicker({
  open,
  providerName,
  provider,
  onFileSelected,
  onCancel,
  defaultFileName = 'money-tree.json',
}: CloudFilePickerProps) {
  const [currentFolder, setCurrentFolder] = useState<CloudItem | undefined>(undefined);
  const [items, setItems] = useState<CloudItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<CloudItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<CloudItem | null>(null);
  const [showFileNameDialog, setShowFileNameDialog] = useState(false);
  const [newFileName, setNewFileName] = useState(defaultFileName);

  const title = `Select ${providerName} File Location`;
  const rootName = providerName;

  // Load root folder on open
  useEffect(() => {
    if (open) {
      loadFolder(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadFolder = async (folder: CloudItem | undefined) => {
    setLoading(true);
    setError(null);
    setSelectedFile(null);

    try {
      const folderItems = await provider.listItems(folder);
      setItems(folderItems);

      // Update breadcrumbs
      if (!folder) {
        // Root folder
        setBreadcrumbs([{ id: 'root', name: rootName, isFolder: true }]);
        setCurrentFolder(undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folder contents');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = async (folder: CloudItem) => {
    // Single click navigates into the folder (both modes)
    await navigateIntoFolder(folder);
  };

  const navigateIntoFolder = async (folder: CloudItem) => {
    setLoading(true);
    setError(null);
    setSelectedFile(null); // Clear selection when navigating

    try {
      const folderItems = await provider.listItems(folder);
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
    const targetBreadcrumb = breadcrumbs[index];
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);

    setLoading(true);
    setError(null);

    try {
      const folder = targetBreadcrumb.id === 'root' ? undefined : targetBreadcrumb;
      const folderItems = await provider.listItems(folder);
      setItems(folderItems);
      setCurrentFolder(folder);
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

  const handleSelectFile = async () => {
    if (selectedFile) {
      // Existing file selected - return it
      onFileSelected(selectedFile);
    }
  };

  const handleCreateHere = async () => {
    // Create new file - build CloudItem descriptor
    const newFileItem: CloudItem = {
      id: '', // Empty ID indicates new file
      name: newFileName,
      isFolder: false,
      parentItemId: currentFolder?.id,
      driveId: currentFolder?.driveId,
    };
    onFileSelected(newFileItem);
    setShowFileNameDialog(false);
  };

  const handleFileNameDialogClose = () => {
    setShowFileNameDialog(false);
    setNewFileName(defaultFileName);
  };

  // Show both folders (for navigation) and JSON files (for selection)
  const jsonFiles = items.filter(
    (item) => !item.isFolder && item.name.toLowerCase().endsWith('.json')
  );
  const folders = items.filter((item) => item.isFolder);

  // Check if file already exists in current folder
  const fileExists = items.some(
    (item) => !item.isFolder && item.name.toLowerCase() === newFileName.toLowerCase()
  );

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
                        {folder.isSharedWithMe && (
                          <PeopleIcon
                            fontSize="small"
                            color="action"
                            titleAccess="Shared with me"
                          />
                        )}
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
                        {file.isSharedWithMe && (
                          <PeopleIcon
                            fontSize="small"
                            color="action"
                            titleAccess="Shared with me"
                          />
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
                  This folder is empty
                </Typography>
              </Box>
            )}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="outlined" onClick={() => setShowFileNameDialog(true)} disabled={loading}>
          Create File
        </Button>
        <Button variant="contained" onClick={handleSelectFile} disabled={!selectedFile || loading}>
          Select File
        </Button>
      </DialogActions>
      <Dialog open={showFileNameDialog} onClose={handleFileNameDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New File</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="File name"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            helperText={
              fileExists ? 'A file with this name already exists' : 'File must have .json extension'
            }
            error={!newFileName.endsWith('.json') || fileExists}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFileNameDialogClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateHere}
            disabled={!newFileName.trim() || !newFileName.endsWith('.json') || fileExists}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
