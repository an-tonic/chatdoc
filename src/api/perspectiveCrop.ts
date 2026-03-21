import {OpenCV, ObjectType, DataTypes} from 'react-native-fast-opencv';
import RNFS from 'react-native-fs';

type Point = { x: number; y: number };

// corners: topLeft, topRight, bottomRight, bottomLeft (in original image pixels)
export async function applyPerspectiveCrop(
    imagePath: string,
    corners: [Point, Point, Point, Point],
    imageWidth: number,
    imageHeight: number,
): Promise<string> {

    // 1. load image into Mat
    const base64 = await RNFS.readFile(imagePath.replace('file://', ''), 'base64');
    const srcMat = OpenCV.base64ToMat(base64);

    // 2. build srcPoints from user's 4 corners
    const srcPoints = OpenCV.createObject(ObjectType.Mat, 4, 1, DataTypes.CV_32FC2, [
        corners[0].x, corners[0].y,
        corners[1].x, corners[1].y,
        corners[2].x, corners[2].y,
        corners[3].x, corners[3].y,
    ]);

    // 3. compute output size — use max width/height of the quad
    const outW = Math.max(
        dist(corners[0], corners[1]),
        dist(corners[3], corners[2]),
    );
    const outH = Math.max(
        dist(corners[0], corners[3]),
        dist(corners[1], corners[2]),
    );

    // 4. build dstPoints — a perfect rectangle
    const dstPoints = OpenCV.createObject(ObjectType.Mat, 4, 1, DataTypes.CV_32FC2, [
        0, 0,
        outW, 0,
        outW, outH,
        0, outH,
    ]);

    // 5. compute transform matrix
    const M = OpenCV.createObject(ObjectType.Mat, 0, 0);
    OpenCV.invoke('getPerspectiveTransform', srcPoints, dstPoints, M);

    // 6. warp
    const dstMat = OpenCV.createObject(ObjectType.Mat);
    const size = OpenCV.createObject(ObjectType.Size, outW, outH);
    OpenCV.invoke('warpPerspective', srcMat, dstMat, M, size);

    // 7. save result
    const outPath = imagePath.replace(/\.[^.]+$/, '_cropped.jpg').replace('file://', '');

    OpenCV.saveMatToFile(dstMat, outPath, 'png', 0);
    // await RNFS.writeFile(outPath.replace('file://', ''), resultBase64, 'base64');

    OpenCV.clearBuffers();
    return `file://${outPath}`;
}

function dist(a: Point, b: Point) {
    return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}