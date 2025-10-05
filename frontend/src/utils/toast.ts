import { notification } from 'antd';

type ToastType = 'success' | 'error' | 'warning' | 'info';

const open = (type: ToastType, message: string, description?: string) => {
    notification[type]({ message, description, placement: 'topRight', duration: 3 });
};

export const toast = {
    success: (msg: string, desc?: string) => open('success', msg, desc),
    error: (msg: string, desc?: string) => open('error', msg, desc),
    warning: (msg: string, desc?: string) => open('warning', msg, desc),
    info: (msg: string, desc?: string) => open('info', msg, desc),
};
