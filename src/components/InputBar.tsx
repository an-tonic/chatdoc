import {Keyboard, TextInput, TouchableOpacity, Vibration, View} from "react-native";
import {styles} from "../styles/styles.ts";
import Icon from "@react-native-vector-icons/material-design-icons";
import {forwardRef, useImperativeHandle, useRef, useState} from "react";

export type InputBarHandle = {
    focus: () => void,
    getText: () => string,
    setText: (newText: string) => void,
    clear: () => void,
};


const InputBar = forwardRef<InputBarHandle, {
    pinnedImageID: number | null;
    onPressAttachFiles: () => void;
    onRecordPressIn?: () => void;
    onRecordPressOut?: () => void;
    onPressSendMessage: (text: string) => Promise<void>
}>((props, ref) => {

    console.log("InputBar component Rendered!");

    const [isRecording, setIsRecording] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const [inputText, setInputText] = useState("");

    useImperativeHandle(ref, () => ({
        focus: () => inputRef.current?.focus(),
        getText: () => inputText,
        setText: (newText: string) => setInputText(newText), // <-- new method
        clear: () => setInputText(""),
    }));


    return <View style={styles.inputRow}>
        <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Message..."
            value={inputText}
            onChangeText={setInputText}
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
                if (!isRecording) return;
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
            onPress={async () => {
                Keyboard.dismiss();
                const textToSend = inputText;
                setInputText("");
                Vibration.vibrate(5);
                await props.onPressSendMessage(textToSend);
            }}
            style={styles.iconButton}
            disabled={inputText.length === 0}>

            <Icon
                name={props.pinnedImageID ? "check-bold" : "send"}
                size={24}
                color={inputText.length > 0 ? "#0b43d6" : "#8c8c8c"}
            />

        </TouchableOpacity>


    </View>;
});

export default InputBar;