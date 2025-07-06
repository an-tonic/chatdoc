import {TextInput, TouchableOpacity, View} from "react-native";
import {styles} from "../styles/styles.ts";
import Icon from "@react-native-vector-icons/material-design-icons";


export default function InputBar(props: {
    value: string,
    onChangeText: (value: (((prevState: string) => string) | string)) => void,
    onPressAttachFiles: () => void,
    onPressSendMessage: () => Promise<void>,
    context: any
}) {
    return <View style={styles.inputRow}>
        <TextInput
            style={styles.input}
            placeholder="Message..."
            value={props.value}
            onChangeText={props.onChangeText}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
        />
        <TouchableOpacity onPress={props.onPressAttachFiles} style={styles.iconButton}>
            <Icon name="paperclip" size={24} color="#818181"/>
        </TouchableOpacity>

        <TouchableOpacity
            style={styles.iconButton}>
            <Icon name="microphone-outline" size={24} color="#818181"/>
        </TouchableOpacity>


        {props.value.length > 0 && (
            <TouchableOpacity
                onPress={props.onPressSendMessage}
                style={styles.iconButton}
                disabled={!props.context}>

                <Icon name="send" size={32} color={props.context ? "#0b43d6" : "#8c8c8c"}/>
            </TouchableOpacity>
        )}

    </View>;
}