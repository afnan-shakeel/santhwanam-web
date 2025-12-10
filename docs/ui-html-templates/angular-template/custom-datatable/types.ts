export enum CellTemplate {
    LINK = 'link',
    BADGE = 'badge',
    COLOR_BADGE = 'color-badge',
    SELECT_DROPDOWN = 'select-dropdown',
    DATE = 'date',
    TIME = 'time',
    DATETIME = 'datetime',

    // custom cell template for more complex rendering
    CUSTOM = 'custom'
}

// color badge color options
export enum ColorBadgeColor {
    // basic colors
    RED = 'red',
    GREEN = 'green',
    BLUE = 'blue',
    ORANGE = 'orange',
    PURPLE = 'purple',
    GRAY = 'gray',
    YELLOW = 'yellow',
    TEAL = 'teal',

    // semantic colors
    SUCCESS = 'success',
    DANGER = 'danger',
    WARNING = 'warning',

    // neutral colors
    LIGHT = 'light',
    DARK = 'dark'
}

export interface DataTableColumn {
    field: string;
    label: string;
    hidden?: boolean;
    sortable?: boolean;
    width?: string;
    cellTemplate?: CellTemplate; // Optional custom cell template identifier. eg: 'link', 'badge', etc.
    hrefField?: string; // Optional field to use for href in 'link' cellTemplate
    colorBadgeMapper?: { [key: string]: ColorBadgeColor };
    // a option to map cell values to a different display value. mainly used for boolean fields. or enum fields. with badges.
    valueMapper?: { [key: string]: string };
}