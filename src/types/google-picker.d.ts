/**
 * Type declarations for Google Picker API
 * Based on @types/google.picker
 */

declare namespace google {
  namespace picker {
    enum ViewId {
      DOCS = 'all',
      FOLDERS = 'folders',
      DOCUMENTS = 'documents',
      SPREADSHEETS = 'spreadsheets',
      PRESENTATIONS = 'presentations',
    }

    enum Feature {
      NAV_HIDDEN = 'navHidden',
      MULTISELECT_ENABLED = 'multiselectEnabled',
    }

    enum Action {
      PICKED = 'picked',
      CANCEL = 'cancel',
    }

    namespace Response {
      const ACTION: 'action';
      const DOCUMENTS: 'docs';
    }

    namespace Document {
      const ID: 'id';
      const NAME: 'name';
      const URL: 'url';
      const MIME_TYPE: 'mimeType';
      const PARENT_ID: 'parentId';
    }

    interface DocumentObject {
      id: string;
      name: string;
      url: string;
      mimeType: string;
      parentId?: string;
    }

    interface ResponseObject {
      action: Action;
      docs?: DocumentObject[];
    }

    interface PickerCallback {
      (data: ResponseObject): void;
    }

    class PickerBuilder {
      addView(viewId: ViewId | View): PickerBuilder;
      addViewGroup(viewGroup: ViewGroup): PickerBuilder;
      setOAuthToken(token: string): PickerBuilder;
      setDeveloperKey(key: string): PickerBuilder;
      setAppId(appId: string): PickerBuilder;
      setCallback(callback: PickerCallback): PickerBuilder;
      enableFeature(feature: Feature): PickerBuilder;
      disableFeature(feature: Feature): PickerBuilder;
      setTitle(title: string): PickerBuilder;
      setLocale(locale: string): PickerBuilder;
      build(): Picker;
    }

    class Picker {
      setVisible(visible: boolean): void;
    }

    class View {
      setMimeTypes(mimeTypes: string): View;
    }

    class DocsView extends View {
      setIncludeFolders(includeFolders: boolean): DocsView;
      setSelectFolderEnabled(enabled: boolean): DocsView;
    }

    class ViewGroup {
      constructor(viewId: ViewId);
      addView(viewId: ViewId): ViewGroup;
    }
  }
}

interface Window {
  gapi: {
    load(
      apiName: string,
      callback:
        | (() => void)
        | {
            callback: () => void;
            onerror?: () => void;
          }
    ): void;
  };
}
