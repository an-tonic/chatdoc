import {BorderTypes, DataTypes, DecompTypes, InterpolationFlags, ObjectType, OpenCV} from 'react-native-fast-opencv';
import RNFS from 'react-native-fs';
import {Point} from "../types/types.ts";


function dist(a: Point, b: Point) {
    return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

export async function applyPerspectiveCrop(
    imagePath: string,
    corners: [Point, Point, Point, Point],
    layoutW: number,
    layoutH: number,// topLeft, topRight, bottomRight, bottomLeft
): Promise<boolean> {

    try {
        const cleanPath = imagePath.replace('file://', '');
        const base64 = await RNFS.readFile(cleanPath, 'base64');
        const srcMat = OpenCV.base64ToMat(base64);
        const info = OpenCV.toJSValue(srcMat);
        const sx = info.cols / layoutW;
        const sy = info.rows / layoutH;
        const scaledCorners: [Point, Point, Point, Point] = corners.map(c => ({
            x: Math.round(c.x * sx),
            y: Math.round(c.y * sy),
        })) as [Point, Point, Point, Point];


        // build srcPoints PointVector
        const srcPt = scaledCorners.map(c => OpenCV.createObject(ObjectType.Point2f, c.x, c.y));
        const srcPoints = OpenCV.createObject(ObjectType.Point2fVector, srcPt);


        // compute output size
        console.log(scaledCorners);
        console.log(dist(scaledCorners[0], scaledCorners[1]), dist(scaledCorners[3], scaledCorners[2]),dist(scaledCorners[0], scaledCorners[3]), dist(scaledCorners[1], scaledCorners[2]));
        const outW = Math.round(Math.max(dist(scaledCorners[0], scaledCorners[1]), dist(scaledCorners[3], scaledCorners[2])));
        const outH = Math.round(Math.max(dist(scaledCorners[0], scaledCorners[3]), dist(scaledCorners[1], scaledCorners[2])));
        console.log(outW, outH);
        // build dstPoints PointVector
        const dstCorners: Point[] = [
            {x: 0, y: 0},
            {x: outW, y: 0},
            {x: outW, y: outH},
            {x: 0, y: outH},
        ];
        const dstPt = dstCorners.map(c => OpenCV.createObject(ObjectType.Point2f, c.x, c.y));
        const dstPoints = OpenCV.createObject(ObjectType.Point2fVector, dstPt);


        // compute transform matrix
        const M = OpenCV.invoke('getPerspectiveTransform', srcPoints, dstPoints, DecompTypes.DECOMP_LU);

        // warp
        const dstMat = OpenCV.createObject(ObjectType.Mat, 1, 1, DataTypes.CV_8UC3);
        const size = OpenCV.createObject(ObjectType.Size, outW, outH);
        const borderVal = OpenCV.createObject(ObjectType.Scalar, 0, 0, 0, 255);
        OpenCV.invoke(
            'warpPerspective',
            srcMat,
            dstMat,
            M,
            size,
            InterpolationFlags.INTER_LINEAR,
            BorderTypes.BORDER_CONSTANT,
            borderVal,
        );

        // 7. save result
        OpenCV.saveMatToFile(dstMat, cleanPath, 'png', 0);
     
        OpenCV.clearBuffers();
        return true
    } catch (e) {
        console.error('perspectiveCrop failed:', e);
        return false;
    }
}