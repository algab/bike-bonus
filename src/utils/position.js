export default function currentPosition(latitude, accuracy) {
    const oneDegreeOfLongitudeInMeters = 111.32 * 1000;
    const circumference = (40075 / 360) * 1000;
    const latDelta = accuracy * (1 / (Math.cos(latitude) * circumference));
    const lonDelta = accuracy / oneDegreeOfLongitudeInMeters;
    const latitudeDelta = Math.max(0, latDelta);
    const longitudeDelta = Math.max(0, lonDelta);
    return { latitudeDelta, longitudeDelta };
};
