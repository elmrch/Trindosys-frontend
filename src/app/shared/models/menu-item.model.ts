export type MenuItemType = 'LINK' | 'DROP_DOWN' | 'ICON' | 'SEPARATOR' | 'EXT_LINK';

export interface MenuItem {
  id: number;
  name: string;
  type: MenuItemType;
  state: string | null;
  icon: string | null;
  svgIcon: string | null;
  tooltip: string | null;
  disabled: boolean;
  parentId: number | null;
  orderIndex: number;
  active: boolean;
}

export interface AssignMenuItemsRequest {
  menuItemIds: number[];
}

export interface MenuItemRequest {
  name: string;
  type: MenuItemType;
  state: string | null;
  icon: string | null;
  svgIcon: string | null;
  tooltip: string | null;
  disabled: boolean;
  parentId: number | null;
  orderIndex: number;
  active: boolean;
}
