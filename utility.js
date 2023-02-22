function Configuration() 
{
  this.Load = function(settings_sheet_name='Settings')
  {
    var userProperties = PropertiesService.getUserProperties();
    // var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings_sheet_name);  
    // values = sheet.getRange(1,2,5,1).getValues();
    
    // if(
    //   (String(values[0]).trim()=='') || 
    //   (String(values[1]).trim()=='') || 
    //   (String(values[2]).trim()=='') || 
    //   (String(values[3]).trim()=='') ||
    //   (String(values[4]).trim()=='')
    //   )
    // {
    //   throw new Error( "Invalid Configuration" );
    // }
    userProperties.setProperty('URL','https://asgardia.atlassian.net');
    userProperties.setProperty('TOKEN','zXkdynEDK7X5YJ3IWAlND2A5');
    userProperties.setProperty('BOARD','19');
    userProperties.setProperty('SPRINT','145');
  }
}
function LoadConfig(sheetname)
{
  var conf = new Configuration();
  conf.Load(sheetname);
}
function GetConfig(param)
{
  var userProperties = PropertiesService.getUserProperties();
  return userProperties.getProperty(param);
}

var fields={
  'key':'key',
  'status':'status',
  'statusCategory':'status',
  'summary':'summary',
  'priority':'priority',
  'assignee':'assignee',
  'subtasks':'subtasks',
  'issuetype':'issuetype',
  'changelog':'changelog',
  'created':'created',
  'labels':'labels',
  'resolutiondate':'resolutiondate',
  'parent':'parent'
};

function Jira() {
  var del = '';
  this.fields_str = ''
  for(var field in fields) 
  {
    if(field == 'changelog')
    {
      this.changelog = true;
      continue;
    }
    if(field == 'statusCategory')
      if(fields.status !== undefined)
        continue;
    this.fields_str += del+fields[field];
    del=',';
  }
  this.fields_str = '&fields='+this.fields_str;
  if(this.changelog)
    this.fields_str += '&expand=changelog';
  
  this.MapIssueType =  function(type)
  {
    return type;
  }
  this.compare_item = function(a, b)
  {
    if(a.created < b.created)
    {
      return -1;
      // a should come after b in the sorted order
    }
    else if(a.created > b.created)
    {
      return 1;
      // and and b are the same
    }
    else
    {
      return 0;
    }
  }
  
  this.ReadDataValues=function(data)
  {
    for(i=0;i<data["values"].length;i++)
    {
      if(data["values"][i].completeDate != null)
      {
        data["values"][i].completeDate=new Date( String(data["values"][i].completeDate)); 
        data["values"][i].completeDate = changeTimezone(data["values"][i].completeDate);
      }
      if(data["values"][i].startDate != null)
      {
        data["values"][i].startDate=new Date( String(data["values"][i].startDate))
        data["values"][i].startDate = changeTimezone(data["values"][i].startDate);
      }
      if(data["values"][i].endDate != null)
      {
        data["values"][i].endDate=new Date( String(data["values"][i].endDate))
        data["values"][i].endDate = changeTimezone(data["values"][i].endDate);
      } 
    }
    if(data['isLast'] === false)
    {
      this.more=true;
      this.maxResults = data['maxResults'];
    }
    else
      this.more=false;
    return data["values"];
  }
  this.ReadDataIssues = function(data)
  {
    var issues=[];
    for(i=0;i<data["issues"].length;i++)
    {
      //console.log(data["issues"][i]);
      issue = {};
      for(var field in fields) 
      {
        switch(field)
        {
          case 'key': 
            issue.key = data["issues"][i].key;
            break;
          case 'status':
            issue.status = data["issues"][i].fields.status.name;
            break;
          case 'statusCategory':
            categoryid = data["issues"][i].fields.status.statusCategory.id;
            if(categoryid == 3)
              issue.statusCategory = 'RESOLVED';
            else if(categoryid == 4)
              issue.statusCategory = 'INPROGRESS';
            else
              issue.statusCategory ='OPEN';
            break;
          case 'created':
            issue.created = new Date( String(data["issues"][i].fields.created));
            issue.created = changeTimezone(issue.created);  
            break;
          case 'resolutiondate':
            if(data["issues"][i].fields.resolutiondate == null)
              issue.resolutiondate=null;
            else
            {
              issue.resolutiondate = new Date( String(data["issues"][i].fields.resolutiondate));
              issue.resolutiondate = changeTimezone(issue.resolutiondate);
              
            }
            break;
          case 'statuscategorychangedate':
            if(data["issues"][i].fields.statuscategorychangedate == null)
              issue.statuscategorychangedate = null;
            else
            {
              issue.statuscategorychangedate = new Date( String(data["issues"][i].fields.statuscategorychangedate));
              issue.statuscategorychangedate = changeTimezone(issue.statuscategorychangedate);
            }
            break;
          case 'timeoriginalestimate':
            issue.timeoriginalestimate = data["issues"][i].fields.timeoriginalestimate;
            break;
          case 'issuetype':
            issue.issuetype =  this.MapIssueType(data["issues"][i].fields.issuetype.name);
            break;
          case 'assignee':
            if(data["issues"][i].fields.assignee == null)
              issue.assignee = 'Unassigned';
            else
            issue.assignee = data["issues"][i].fields.assignee.displayName.split(" ");
            break;
          case 'description':
            issue.description = data["issues"][i].fields.description;
            break;
          case 'summary':
            issue.summary = data["issues"][i].fields.summary;
            break;
          case 'priority':
            if(data["issues"][i].fields.priority === undefined)
              issue.priority = null;
            else
            {
              if(data["issues"][i].fields.priority == null)
                issue.priority = null;
              else
                issue.priority = data["issues"][i].fields.priority.name;
            }
            break;
          case 'subtasks':
            issue.subtasks = [];
            if(data["issues"][i].fields.subtasks == undefined)
              break;
            for(var j=0;j<data["issues"][i].fields.subtasks.length;j++)
            {
              issue.subtasks [j] = {};
              issue.subtasks [j].key = data["issues"][i].fields.subtasks[j].key;
              issue.subtasks [j].type = data["issues"][i].fields.subtasks[j].fields.issuetype.name;
              issue.subtasks [j].status = data["issues"][i].fields.subtasks[j].fields.status.name;
            }
            break;
          case  'changelog':
            issue.transitions = [];
            if( data["issues"][i].changelog != null)
            {
              for(var j=0;j<data["issues"][i].changelog.histories.length;j++)
              {
                history = data["issues"][i].changelog.histories[j];
                for(var k=0;k<history.items.length;k++)
                {
                  item=history.items[k];
                  if(item.field == "status")
                  {
                    item.created = new Date( String(history.created));
                    item.created = changeTimezone(item.created);
                    issue.transitions.push(item);
                  }
                }
              }
            }                        
            break;
          case 'issuelinks':
            issue.linkedtasks = [];
            if(data["issues"][i].fields.issuelinks === undefined)
              break;
            for(j=0;j<data["issues"][i].fields.issuelinks.length;j++)
            {
              link = data["issues"][i].fields.issuelinks[j];
              lissue = {};
              if(link.outwardIssue !== undefined)
              {
                lissue.key = link.outwardIssue.key;
                lissue.type = link.outwardIssue.fields.issuetype.name;
                lissue.status = link.outwardIssue.fields.status.name;
                categoryid = link.outwardIssue.fields.status.statusCategory.id;
                if(categoryid == 3)
                  lissue.statusCategory = 'RESOLVED';
                else if(categoryid == 4)
                  lissue.statusCategory = 'INPROGRESS';
                else
                  lissue.statusCategory ='OPEN'; 
                issue.linkedtasks.push(lissue); 
              }   
            }
            break;
          case 'parent':
            if(data["issues"][i].fields.parent == null)
              issue.parent = null;
            else
              issue.parent = data["issues"][i].fields.parent.key;
            break;
          case 'labels':
            if(data["issues"][i].fields.labels == null)
              issue.labels=[];
            else
              issue.labels = data["issues"][i].fields.labels;
            break;
          case field:
            if(data["issues"][i].fields[fields[field]] == null)
              issue[field] = null;
            else 
              issue[field] =  data["issues"][i].fields[fields[field]]; 
            break;
        }
      }
      issue.transitions.sort(this.compare_item);
      issues.push(issue);
    }
    return issues;
  }
  this.ParseResponse = function(httpResponse)
  {
    var issues = [];
    if (httpResponse) 
    {  
      var rspns = httpResponse.getResponseCode();
      switch(rspns)
      {
        case 200:          
          var data = JSON.parse(httpResponse.getContentText()); 
          if(Array.isArray(data)===true)
          {
            return data;
          }
          else if(data["values"] !== undefined)
            return this.ReadDataValues(data);
            
          else if(data["issues"] !== undefined)
            return this.ReadDataIssues(data);

          throw new Error("Data cannot be parsed");
          break;
        case 404:
          throw new Error("Response error, No item found");
          break;
        default:
          throw new Error(httpResponse.getContentText());
          //var data = JSON.parse(httpResponse.getContentText());
          //throw new Error("Error: " + data.errorMessages.join(",")); // returns all errors that occured
          break;
      }
    }
    else 
    {
      throw new Error("Unable to make requests to Jira!");
    }
    return issues;
  }

  this.JiraFetch = function(resource)
  {
    var start=0;
    var max=100;
    var token = GetConfig("TOKEN");
    var args = {
      contentType: "application/json",
      headers: {"Authorization":"Basic "+token},
      muteHttpExceptions : true
    };
    var allissues = [];
    this.more=false;
    while(1)
    {
      var resource_ = resource+'&startAt='+start+'&maxResults='+max;
      console.log("Fetching = "+resource_);
      var httpResponse = UrlFetchApp.fetch(resource_, args);
      var issues = this.ParseResponse(httpResponse);
      if(this.more===true)
      {
          max = this.maxResults;
      }
      allissues = allissues.concat(issues);
      
      if(issues.length == max)
      {
        start = start + max;
      }
      else
      {
        console.log("Found "+allissues.length+" Records");
        return allissues;
      }
    }
    return [];  
  }
  this.GetTasksInSprint = function(url,sprintid,allfields=false)
  {
    var resource = url+"/rest/agile/1.0/sprint/"+sprintid+"/issue?";
    if(allfields == false)
      resource += this.fields_str;
    
    return this.JiraFetch(resource);
  }

  this.BoardSprints = function(url,boardid)
  {
    var resource = url+"/rest/agile/1.0/board/"+boardid+'/sprint?';
    return this.JiraFetch(resource);
  }
  this.GetAllStatus =  function(url)
  {
    var resource = url+"/rest/api/latest/status?";
    var statuses = this.JiraFetch(resource);
    var out = [];
    for(var i=0;i<statuses.length;i++)
    {
      var status = statuses[i];
      out[status.name.toLowerCase()]={'id' : status.statusCategory.id,'category':status.statusCategory.name};
    }
    return out;
  }
  this.GetSprintDetails = function(url,boardid,sprintname)
  {
    var sprints = this.BoardSprints(url,boardid);
    
    sprintname = sprintname.toLowerCase();
    for(var i=0;i<sprints.length;i++)
    {
      //console.log(sprintname+" #  "+sprints[i].name.toLowerCase());
      if(sprints[i].name.toLowerCase() === sprintname)
      {
        return sprints[i];
      } 
    }
    return null;
  }
  this.SearchIssues=function(url,jql,allfields=false)
  {
    
    var resource = url+"/rest/api/latest/search?"+'jql='+jql;
    if(allfields == false)
      resource += this.fields_str;
    return this.JiraFetch(resource);
  }
  this.GetFields=function(url)
  {
    var resource = url+"/rest/api/latest/field?param=null";
    return this.JiraFetch(resource);
  }
  this.DumpFields=function(url)
  {
    var fields = this.GetFields(url);
    for(var i=0;i<fields.length;i++)
    {
      console.log(fields[i]);
    }
  }
  this.Parents=function(url,tasks,parent_field='epiclink')  // or 'parent'
  {
    var epics = [];
    var count = 0;
    for(var i=0;i<tasks.length;i++)
    {
      var task = tasks[i];
      if(task[parent_field] != null)
      {
        epics[task[parent_field]]=task[parent_field];
        count++;
      }
    }
    if(count > 0)
    {
      epicsobj ={};
      var query='key in (';
      var del='';
      for (epic in epics) 
      {
        query += del+epic;
        del = ",";
      }
      query += ')';
      epics = this.SearchIssues(url,query);
      for(var i=0;i<epics.length;i++)
      {
        var epic=epics[i];
        epicsobj[epic.key]=epic;
      }
      for(var i=0;i<tasks.length;i++)
      {
        var task = tasks[i];
        if(task[parent_field] != null)
        {
          task[parent_field] = epicsobj[task[parent_field]];
        }
      }
    }
    return tasks;
  }
  this.ComputeTransitionTimes=function(task,statuses)
  {
    var status = task.status.toLowerCase();
    var category=statuses[status].category;
    var basestart = task.created;
    var statetime = {};	
		
    statetime[status] =  {};
    statetime[status].catgory=category
		statetime[status].start = basestart;
		statetime[status].end = null;
    statetime[status].min = [];
        
    for(var i=0; i < task.transitions.length ;i++)
    {
      var transition = task.transitions[i];
      //console.log(transition);
      var fromstate = transition.fromString.toLowerCase();
      var fromstate_category=statuses[fromstate].category;


			var tostate = transition.toString.toLowerCase();
      var tostate_category=statuses[tostate].category;

      //console.log (statuses[tostate].id+"  "+statuses[tostate].category);
      //if(statuses[tostate].id == 4)// in progress
      //{
      //  if(task.progressstartdate === undefined)
      //    task.progressstartdate = transition.created;
      //}
			var time = transition.created;

      if(statetime[fromstate] === undefined)
			{
			  statetime[fromstate] =  {};
        statetime[fromstate].category = fromstate_category;
			  statetime[fromstate].start = null;
				statetime[fromstate].end = null;
        statetime[fromstate].min = [];
			}
			if(statetime[tostate] === undefined)
			{
				statetime[tostate] =  {};
        statetime[tostate].category = tostate_category;
				statetime[tostate].start = null;
				statetime[tostate].end = null;
        statetime[tostate].min = [];
			}
      statetime[fromstate].end = time;
      if(statetime[fromstate].start == null)
					statetime[fromstate].start = basestart;
      var min = (statetime[fromstate].end.getTime() - statetime[fromstate].start.getTime())/(1000*60);
      if(min > 0)
      {
        wmin=workingMinutesBetweenDates(statetime[fromstate].start,statetime[fromstate].end);
        if(wmin > 0)
		      statetime[fromstate].min.push(wmin)
      }
      statetime[tostate].start = time;
			statetime[tostate].end = null;
      //console.log(statetime);
    }
    //console.log(statetime);
    for(var state in statetime) 
    {
      var obj = statetime[state];
      
      if(obj.end == null)
      {
        if(task.resolutiondate !== null)
          statetime[state].end = statetime[state].start;
        else
			    statetime[state].end = new Date();
        
        min = (statetime[state].end.getTime() - statetime[state].start.getTime())/(1000*60);
        if(min > 0)
        {
          wmin=workingMinutesBetweenDates(statetime[state].start,statetime[state].end);
          if(wmin > 0)
		        statetime[state].min.push(wmin)
        }
      }
      obj.state = state;
      obj.minutes = 0;
      for(var i=0;i<obj.min.length;i++)
      {
        obj.minutes += obj.min[i];
      }
      //console.log(obj);
      obj.dhm = SecondsToDhm(obj.minutes*60);
      //console.log(task.key,obj.dhm);
      if((obj.category !== undefined)&&(obj.category == 'In Progress'))
      {
        if( statetime.inprogressmin === undefined)
          statetime.inprogressmin=0;
        statetime.inprogressmin += obj.minutes
      } 
    }
    statetime.inprogressdhm = SecondsToDhm(statetime.inprogressmin*60);
    task.statetime = statetime;
    //console.log(statetime);
    //console.log("Progress start date "+task.progressstartdate);
    if(task.key == 'INDLIN-4503')
      console.log(statetime);
    return statetime;
  }
}

function changeTimezone2(time, zone=tzone) {
    var format = 'YYYY/MM/DD HH:mm:ss ZZ';
    return moment(time, format).tz(zone).format(format);
}
function changeTimezone(date, ianatz="Africa/Johannesburg") 
{
  // suppose the date is 12:00 UTC
  var invdate = new Date(date.toLocaleString('en-US', {
    timeZone: ianatz
  }));
  return invdate;
}
function SecondsToDhm(seconds) 
{
  if(seconds<60)
     seconds=60
  seconds = Number(seconds);
  var d = Math.floor(seconds / (3600*24));
  var h = Math.floor(seconds % (3600*24) / 3600);
  var m = Math.floor(seconds % 3600 / 60);
  var s = Math.floor(seconds % 60);
  var dDisplay = d > 0 ? d + 'd' : "";
  var hDisplay = h > 0 ? h + 'h' : "";
  var mDisplay = m > 0 ? m + 'm' : "";
  
  var str = '';
  var del ='';
  if(dDisplay != '')
  {
    str += dDisplay;
    del = ",";
  }
  if(hDisplay != '')
  {
    str += del+hDisplay;
    del = ",";
  }
  if(mDisplay != '')
  {
    str += del+mDisplay;
    del = ",";
  }
  return str;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
function exit(error='')
{
  throw new Error( error);
}
function DiffInMin(first,second)
{
  return (second.getTime() - first.getTime())/(1000*60);
}
function CreateNewSheet(name)
{
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var yourNewSheet = activeSpreadsheet.getSheetByName(name);
  if (yourNewSheet == null) 
  {
    yourNewSheet = activeSpreadsheet.insertSheet();
    yourNewSheet.setName(name);
  }
}
function CopySheetData(src,dest)
{
  var source = SpreadsheetApp.getActiveSpreadsheet();
  var srcsheet = source.getSheetByName(src);
  var destsheet = source.getSheetByName(dest);

  if (destsheet != null) 
  {
    source.deleteSheet(destsheet);
  }
  srcsheet.copyTo(source).setName(dest);
}
// Simple function that accepts two parameters and calculates
// the number of hours worked within that range
function workingMinutesBetweenDates(startDate, endDate, dayStart=9, dayEnd=18, includeWeekends=false) {
    // Store minutes worked
    var minutesWorked = 0;

    // Validate input
    if (endDate < startDate) { return 0; }

    // Loop from your Start to End dates (by hour)
    var current = startDate;

    // Define work range
    var workHoursStart = dayStart;
    var workHoursEnd = dayEnd;

    // Loop while currentDate is less than end Date (by minutes)
    while(current <= endDate){      
        // Store the current time (with minutes adjusted)
        var currentTime = current.getHours() + (current.getMinutes() / 60);

        // Is the current time within a work day (and if it
        // occurs on a weekend or not)                   
        if(currentTime >= workHoursStart && currentTime < workHoursEnd && (includeWeekends ? current.getDay() !== 0 && current.getDay() !== 6 : true)){
              minutesWorked++;
        }

        // Increment current time
        current.setTime(current.getTime() + 1000 * 60);
    }

    return minutesWorked;
    return (minutesWorked / 60).toFixed(2);
}

 function Report(sprint, tasks, sheetname='Report')
 {
  this.sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetname);
  this.datarow = 9;
  this.statustotrackrow = 8;
  this.statustotrackcol = 8;
  this.closedoncol = 6; // Deffault if no status is tracked.

  this.deleteDataRows = function()
  {
    var noofrows = this.sheet.getLastRow();
    console.log('Deleting Data rows till row no '+noofrows);
    if(noofrows > (this.datarow-1))
      this.sheet.deleteRows(this.datarow, noofrows-(this.datarow-1));
  }
  this.StatusToTrack = function(vstatus)
  {
    /////////////////////////////////////////////////////////////////////////////////////////////
    //  Read particular row and column for the status that requires tracking
    //  These status will be compared with status defined in Jira and in case status is not found
    //  error will be generated
    ////////////////////////////////////////////////////////////////////////////////////////////

    var row=this.statustotrackrow;
    var col=this.statustotrackcol;
    var statustotrack = [];
    while(1)
    {
      var status = this.sheet.getRange(row,col).getValue();
      status =  status.trim().toLowerCase();
      if(status == 'total')
        break;
      if(vstatus[status] === undefined)
      {
        throw new Error( "Invalid Status "+status );
      }
      vstatus[status].bcolor = this.sheet.getRange(row,col).getBackground();
      vstatus[status].status =  status;
      vstatus[status].col = col++;
      statustotrack[status] = vstatus[status];
    }
    return statustotrack;
  }
  
  this.Publish = function(url,sprint,tasks,statustotrack)
  {
    
    
    var row=1,col=2;
    var sheet =  this.sheet;

    /////////////////////////////////////////////////////////////////////////////////////////
    // Delete old data rows
    ////////////////////////////////////////////////////////////////////////////////////////
    
    this.deleteDataRows();


    /////////////////////////////////////////////////////////////////////////////////////////
    // Publish sprint details
    ////////////////////////////////////////////////////////////////////////////////////////

    sheet.getRange(row++,col).setValue(sprint.id); 
    sheet.getRange(row++,col).setValue(sprint.name);
    console.log(sprint);
    if(sprint.state != 'future')
    {
      sheet.getRange(row++,col).setValue(sprint.startDate.toString());
      sheet.getRange(row++,col).setValue(sprint.endDate.toString());
    }
    else
    {
      sheet.getRange(row++,col).setValue('');
      sheet.getRange(row++,col).setValue('');
    }
    sheet.getRange(row,col).setValue(capitalizeFirstLetter(sprint.state));
    if(sprint.state.toLowerCase() == 'active')
      sheet.getRange(row,col).setBackground("#66FF66");
    else if(sprint.state.toLowerCase() == 'closed')
      sheet.getRange(row,col).setBackground("#D3D3D3");
    else
      sheet.getRange(row,col).setBackground("white");
    row++;
    sheet.getRange(row++,col).setValue(new Date().toString());
    
    row = this.datarow;
    
    for(var i=0;i<tasks.length;i++)
    {
      col = 1;
      var task = tasks[i];
      var statetime = task.statetime;

      ///////////////////////////////////////////////////////////////////////////////////
      // Publish task details
      /////////////////////////////////////////////////////////////////////////////////

      sheet.getRange(row,col++).setValue(task.issuetype);
      var hyperlink='=HYPERLINK("'+url+'/browse/'+task.key+'","'+task.key+'")';
      sheet.getRange(row,col++).setFormula(hyperlink);
      sheet.getRange(row,col++).setValue(task.summary).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
      if(task.parent != null)
      {
        var hyperlink='=HYPERLINK("'+url+'/browse/'+task.parent.key+'","'+task.parent.summary+'")';
        //sheet.getRange(row,col++).setValue(task.parent.summary).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
        sheet.getRange(row,col++).setFormula(hyperlink);
      }
      else
       sheet.getRange(row,col++).setValue('');

      sheet.getRange(row,col++).setValue(task.created.toISOString().split("T")[0]).setHorizontalAlignment("left")

      ///////////////////////////////////////////////////////////////////////////////////
      // Publish status
      // If the user has not mentioned this status for tracking then its background will 
      // be white and foreground clour will be grey or red depending on statuscategory
      //////////////////////////////////////////////////////////////////////////////////

      if(statustotrack[task.status.toLowerCase()] === undefined)
      {
        if(task.statusCategory == 'RESOLVED')
          sheet.getRange(row,col++).setValue(task.status).setBackground('white').setFontColor('grey');
        else
          sheet.getRange(row,col++).setValue(task.status).setBackground('white').setFontColor('red');
      }
      else
        sheet.getRange(row,col++).setValue(task.status).setBackground(statustotrack[task.status.toLowerCase()].bcolor).setFontColor('black');
      
      sheet.getRange(row,col++).setValue(task.assignee).setBackground('white').setFontColor('grey');
      

      ///////////////////////////////////////////////////////////////////////////////////
      // Publish time taken in each state
      //////////////////////////////////////////////////////////////////////////////////
      var lastcol = this.closedoncol;
      for(var state in statustotrack)
      {
        var  fcolor = 'grey';
        if(state == task.status.toLowerCase())
          fcolor = 'green';
        
        if(task.resolutiondate != null)
          fcolor = 'grey';

        var obj = statustotrack[state];
        if(statetime[state] !== undefined)
          sheet.getRange(row,obj.col).setValue(statetime[state].dhm).setBackground('white').setFontColor(fcolor);
        else
          sheet.getRange(row,obj.col).setValue('').setBackground('white').setFontColor(fcolor);
        lastcol = obj.col;
      }


      var totalmin = 0;
      //console.log(task.resolutiondate);
      //////////////////////////////////////////////////////////////////////////////////
      // Publish total time taken by ticket as well as date on which ticket is closed
      // If , resolution date is set then time taken is computed based on ticket progressstartdate and ticket resolution datetime
      // other wise time taken is computed based on ticket creation and current time
      //////////////////////////////////////////////////////////////////////////////////

      
      sheet.getRange(row,lastcol+1).setValue(statetime.inprogressdhm).setBackground('white').setFontColor('grey');
      if(task.resolutiondate != null)
        sheet.getRange(row,lastcol+2).setValue(task.resolutiondate.toISOString().split("T")[0]).setBackground('white').setHorizontalAlignment("left").setFontColor('grey');
      else
         sheet.getRange(row,lastcol+2).setValue('').setBackground('white').setHorizontalAlignment("left").setFontColor('black');
      row++
    }
    CopySheetData('Report',sprint.name);
  }
 } 
 

function Main() 
{
  // Load configuration
    
  var conf = new Configuration();
  console.log(conf);
  conf.Load('Settings');
  var url = GetConfig('URL')
  var sprint = GetConfig('SPRINT');
  var board = GetConfig('BOARD');
  console.log('Params url='+url+' board='+board+' sprint='+sprint);
  
  /////// Create Jira instance //////////////////
  var jira =  new Jira();
  //jira.DumpFields(url);
  //exit();
  //tasks = jira.SearchIssues(url,"key in (DE-3119)", true);
  //tasks = jira.Parents(url,tasks,'parent');

  //tasks = jira.SearchIssues(url,"'Epic Link' is not empty", true);
  //tasks = jira.SearchIssues(url,'"Epic Link" is not empty', true);
  //DE-3093
  //console.log(tasks);
  //exit();

  /////// Create Report instance //////////////////
  var report = new Report('Report');

  /////// Get All Status configured in Jira //////////////////
  var statuses = jira.GetAllStatus(url);
  
  /////// Read status from report which will be tracked //////////////////
  var statustotrack = report.StatusToTrack(statuses);
  
  /////// Read sprint info //////////////////
  var sprint = jira.GetSprintDetails(url,board, sprint);
  if(sprint == null)
    exit("Sprint Not Found");
  /////// Read task in the sprint (Jira returns all tasks even those that were never closed and now move to either backlog or other sprints) //////////////////
  var tasks = jira.GetTasksInSprint(url,sprint.id);
  tasks = jira.Parents(url,tasks,'parent');
  
  /////// Compute time spent in each state
  for(var i=0;i<tasks.length;i++)
    jira.ComputeTransitionTimes(tasks[i],statuses);
  
  /////// Publish report
  report.Publish(url,sprint,tasks,statustotrack);
  
}
 
