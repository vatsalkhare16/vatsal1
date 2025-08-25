const level1 = {
    val : `

    <div class="l1-outer">

        <div class="l1-inner-left">

            <div class="preview">

                <div class="for-grid">

                    <div class="field-box">
                        <img class="field-img" src="level1/field.jpg">
                    </div>
                    
                    <div class="ball-box">
                        <img class="ball-img" src="level1/ball.png">
                    </div>

                </div>

            </div>
            
        </div>

        <div class="l1-inner-right">
    
            <!-- <div style="
                height: 5%;
                width: 100%;  
                ">
                <button class="previouslevel-button" onclick="back()">Back</button>
            </div> -->

            <P class="level">Level 1</P>

            <center><P class="statement"> 
                <span style="font-size: larger;
                font-weight: bold;
                color: black;
                ">Statement  &#58
                </span>
                Assume the field to be a flexbox <br> & let ball be an element inside.</P></center> 
            <center><P class="task">
                <span style="font-size: larger;
                font-weight: bold;
                color: black;
                ">&nbsp &nbsp &nbsp &nbsp Task &#58
                </span>  
                place the ball in middle of field <br>using Flexbox CSS Property</P></center> 

            <input class="input" type="text" placeholder="Type your answer" 
                onkeydown="
                if(event.key == 'Enter'){
                    checkans();
                }else{
                    document.querySelector('.result').innerHTML = '';
                }
            ">

            <button class="check" onclick="checkans()">Check</button>

            <div class="result"></span>

        </div>
        
    </div>

    <script src="Main.js"></script>`,

    bodycss : 'level1-body',
    addin: '.ball-box',
    this : 'ball-box-after',

    ans : 'justify-content:center'
}

const level2 = {
    val : `
    <div class="l2-outer">

    <div class="l2-inner-left">

        <div class="preview">

            <div class="for-grid">

                <div class="planet-box">
                    <img class="planet-img" src="level2/middle-planet.jpg">
                </div>
                
                <div class="spaceship-box">
                    <img class="spaceship-icon" src="level2/spaceship-icon.png">
                </div>

            </div>

        </div>
        
        </div>

        <div class="l2-inner-right">

        <div style="
            height: 5%;
            width: 100%;  
            ">
            <button class="previouslevel-button" onclick="back()">Back</button>
        </div>

        <P class="level">Level 2</P>

        <center><P class="statement"> 
            <span style="font-size: larger;
            font-weight: bold;
            color: black;
            ">Statement  &#58
            </span>
            Assume whole space to be a flexbox <br> & let spaceship be an element inside. </P></center> 
        <center><P class="task">
            <span style="font-size: larger;
            font-weight: bold;
            color: black;
            ">&nbsp &nbsp &nbsp &nbsp Task &#58
            </span>  
            place the spaceship in middle of space <br> using Flexbox CSS Property</P></center> 

        <input class="input" type="text" placeholder="Type your answer" 
            onkeydown="
            if(event.key == 'Enter'){
                checkans();
            }else{
                document.querySelector('.result').innerHTML = '';
            }
        ">

        <button class="check" onclick="checkans()">Check</button>

        <div class="result"></span>

    </div>
    
</div>

<script src="Main.js"></script>
    `,

    bodycss : 'level2-body',
    addin: '.spaceship-box',
    this : 'spaceship-box-after',

    ans : 'align-items:center'
}

const level3 = {
    val : `<div class="l3-outer">

    <div class="l3-inner-left">

        <div class="preview">

            <div class="for-grid">

                <div class="map-box">
                    <img class="map-img" src="level3/map.png">
                </div>
                
                <div class="pin-box">
                    <img class="pin-img" src="level3/pin.png">
                </div>

            </div>

        </div>
        
    </div>

    <div class="l3-inner-right">

        <div style="
            height: 5%;
            width: 100%;  
            ">
            <button class="previouslevel-button" onclick="back()">Back</button>
        </div>

        <P class="level">Level 3</P>

            <center><P class="statement"> 
                <span style="font-size: larger;
                font-weight: bold;
                color: black;
                ">Statement  &#58
                </span>
                Assume the map to be a flexbox <br> & let pin be an element inside.</P></center> 
            <center><P class="task">
                <span style="font-size: larger;
                font-weight: bold;
                color: black;
                ">&nbsp &nbsp &nbsp &nbsp Task &#58
                </span>  
                place the pin ont top of the red cross <br>using Flexbox CSS Property</P></center> 

            <input class="input" type="text" placeholder="Type your answer" 
                onkeydown="
                if(event.key == 'Enter'){
                    checkans();
                }else{
                    document.querySelector('.result').innerHTML = '';
                }
            ">

            <button class="check" onclick="checkans()">Check</button>

            <div class="result"></span>

        </div>
        
    </div>

    <script src="Main.js"></script>
`,

    bodycss : 'level3-body',
    addin: '.pin-box',
    this : 'pin-box-after',

    ans : 'justify-content:start'
}



const levelsbody = [level1,level2,level3];
let i = 0;

document.body.innerHTML = levelsbody[i].val;
document.querySelector('.level-body').classList.add(levelsbody[i].bodycss);

function checkans(){

    let a = document.querySelector('.input');

    let val = (String(a.value).trim()).toLowerCase();
    
    let arr = val.split(' ');

    let val2 = '';

    for(let i=0;i<arr.length;i++){
        val2 = val2.concat((arr[i].trim()));
    }

    if(val2 == levelsbody[i].ans){
        document.querySelector('.result').innerHTML = '<p>Correct yay!!</p> <button class="nextlevel-button" onclick="changelevel()">Next Level</button>';
        document.querySelector('.result').classList.add('correct');
        document.querySelector(levelsbody[i].addin).classList.add(levelsbody[i].this);
    }else{
        document.querySelector('.result').innerHTML = 'Wrong';
        document.querySelector('.result').classList.remove('correct');
    }
} 

function changelevel(){
    i++;
    document.body.innerHTML = levelsbody[i].val;
    document.querySelector('.level-body').classList.add(levelsbody[i].bodycss);
}

function back(){
    if(i>0){
        document.body.innerHTML = levelsbody[i-1].val;
        document.querySelector('.level-body').classList.remove(levelsbody[i].bodycss);
        i--;
    }
}
