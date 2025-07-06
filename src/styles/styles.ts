import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {padding: 20},

    imageDescription: {
        color: '#555',
        fontSize: 12,
        paddingTop: 4,
        paddingHorizontal: 6,
        textAlign: 'left',
    },

    pinnedImageBubble: {
        borderWidth: 2,
        borderColor: '#0b43d6',
        borderRadius: 8,
        position: 'relative',
    },

    pinIconOverlay: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 2,
    },


    chatContainer: {
        padding: 10,
        gap: 10,
        flexDirection: 'column',
    },

    imageBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        padding: 5,
        maxWidth: '80%',
    },

    image: {
        width: 250,
        height: 250,
        borderRadius: 10,
    },

    button: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
    },

    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 0,
        paddingBottom: 0,
        borderWidth: 0,
        overflow: 'hidden',
    },

    input: {
        flex: 1,
        paddingLeft: 10,
        fontSize: 18
    },

    iconButton: {
        backgroundColor: 'rgba(0,0,0,0)',
        paddingHorizontal: 10,
        paddingBottom: 10
    }


});
