import {Image, Text, TouchableOpacity, View} from "react-native";
import {styles} from "../styles/styles.ts";
import Icon from "@react-native-vector-icons/material-design-icons";
import {ImageMessage} from "../types/types.ts";


export default function BubbleImage(props: {
    pinnedImageID: number | null,
    image: ImageMessage
    onPress: () => void,
}) {

    return <TouchableOpacity

        style={[
            styles.imageBubble,
            props.image.source === "search" ? styles.msgLeft : styles.msgRight,
            props.pinnedImageID === props.image.databaseID && styles.pinnedImageBubble
        ]}
        onPress={props.onPress}
    >
        <View style={styles.imageWrapper}>
            <Image
                source={{uri: props.image.uri}}
                style={styles.image}
                resizeMode="cover"
            />
            {props.pinnedImageID === props.image.databaseID && (
                <View style={styles.pinIconOverlay}>
                    <Icon name="pin-outline" size={20} color="#0b43d6"/>
                </View>
            )}
        </View>

        <Text
            style={styles.imageDescription}
            numberOfLines={2}
            ellipsizeMode="tail"
        >
            {props.image.description ?? ""}
        </Text>
    </TouchableOpacity>;
}