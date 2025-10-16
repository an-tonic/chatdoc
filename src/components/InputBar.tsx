import {TextInput, TouchableOpacity, Vibration, View} from "react-native";
import {styles} from "../styles/styles.ts";
import Icon from "@react-native-vector-icons/material-design-icons";
import {forwardRef, useImperativeHandle, useRef, useState} from "react";

export type InputBarHandle = {
    focus: () => void
};



const InputBar = forwardRef<InputBarHandle, {
    value: string,
    onChangeText: (value: string | ((prevState: string) => string)) => void,
    onPressAttachFiles: () => void,
    onRecordPressIn?: () => void;
    onRecordPressOut?: () => void;
    onPressSendMessage: () => Promise<void>
}>((props, ref) => {

    console.log("InputBar component Rendered!");
    const [isRecording, setIsRecording] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useImperativeHandle(ref, () => ({
        focus: () => {
            inputRef.current?.focus();
        }
    }));

    return <View style={styles.inputRow}>
        <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Message..."
            value={props.value}
            onChangeText={props.onChangeText}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
        />
        <TouchableOpacity
            onPress={() => {
                Vibration.vibrate(5);
                props.onPressAttachFiles();
            }}
            style={styles.iconButton}>

            <Icon name="paperclip" size={24} color="#818181"/>
        </TouchableOpacity>

        <TouchableOpacity
            onLongPress={() => {
                setIsRecording(true);
                Vibration.vibrate(20);
                props.onRecordPressIn?.();
            }}

            onPressOut={() => {
                if(!isRecording) return;
                setIsRecording(false);
                Vibration.vibrate(5);
                props.onRecordPressOut?.();
            }}
            style={styles.iconButton}
            activeOpacity={1}
        >
            {isRecording && (
                <View style={styles.recordingBackground}/>
            )}
            <Icon
                name="microphone-outline"
                size={24}
                color={isRecording ? "#0b43d6" : "#818181"}
            />
        </TouchableOpacity>


        <TouchableOpacity
            onPress={() => {
                Vibration.vibrate(5);
                void props.onPressSendMessage();
            }}
            style={styles.iconButton}
            disabled={props.value.length === 0}>

            <Icon name="send" size={24} color={props.value.length > 0 ? "#0b43d6" : "#8c8c8c"}/>
        </TouchableOpacity>


    </View>;
});

export default InputBar;