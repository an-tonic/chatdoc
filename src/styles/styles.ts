import {Dimensions, StyleSheet} from 'react-native';

const screenWidth = Dimensions.get('window').width;

export const styles = StyleSheet.create({
    container: {padding: 20},



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

    textBubble: {
        backgroundColor: '#e3e2e2',
        padding: 10,
        borderRadius: 10,
        marginVertical: 4,
        maxWidth: '80%',
        alignSelf: 'flex-end', // or 'flex-start' for received messages
    },
    textMessage: {
        fontSize: 16,
        color: '#333',
    },

    imageBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#eae9e9',
        borderRadius: 12,
        padding: 5,
        width: screenWidth * 0.6,

    },
    msgLeft: {
        alignSelf: 'flex-start',
        backgroundColor: '#d6d6d6'
    },
    msgRight: {
        alignSelf: 'flex-end',
        backgroundColor: '#d0e0ff'
    },

    imageWrapper: {
        width: '100%',
        aspectRatio: 1,
    },

    image: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    imageDescription: {
        color: '#555',
        fontSize: 12,
        paddingTop: 4,
        paddingHorizontal: 6,
        textAlign: 'left',
    },
    defaultButton: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },

    dangerButton:{
        backgroundColor: '#ff0000',
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
        backgroundColor: '#e1e0e0'
    },

    input: {
        flex: 1,
        paddingLeft: 15,
        fontSize: 18
    },

    iconButton: {
        backgroundColor: 'rgba(0,0,0,0)',
        paddingRight: 15,
        paddingBottom: 10
    }


});
