import type { Resource } from "~~/types/file-tree";


export const getFolder = (item: Resource) => {
    if (item.type == "directory") {
        return item.path + '/'
    } else {
        return item.path.split("/").slice(0, -1).join("/") + '/'
    }
}

export const getObjectPath = (resourcePath: string): string[] => {
    const deleted = resourcePath.split("/").splice(1);
    const l = deleted.length * 2 - 2;
    for (let i = 0; i < l; i += 2) {
        deleted.splice(i + 1, 0, "content");
    }
    return deleted;
};

export const getFileExtension = (path: string) => {
    const match = path.match(/\.(\w+)$/)
    return match ? match[1] : path.toLowerCase()
}